from __future__ import annotations
import pandas as pd
import numpy as np
from pathlib import Path
from engines.behavior_engine import _load_data as get_master_data

def evaluate_portfolio(file_content: bytes) -> dict:
    """
    Evaluates an uploaded CSV of transactions.
    Expected CSV columns: Date, Type (Buy/Sell), Amount, Fund
    Now returns monthly timeseries curves for both actual and disciplined strategies.
    """
    import io
    df_trans = pd.read_csv(io.BytesIO(file_content))

    df_trans.columns = [c.strip().lower() for c in df_trans.columns]
    if not all(col in df_trans.columns for col in ['date', 'type', 'amount', 'fund']):
        return {"error": "Invalid CSV format. Required columns: Date, Type, Amount, Fund"}

    df_trans['date'] = pd.to_datetime(df_trans['date'])
    df_trans = df_trans.sort_values('date')

    df_master = get_master_data()
    df_master['date'] = pd.to_datetime(df_master['date'])

    results = []

    for fund_id, gp in df_trans.groupby('fund'):
        fund_navs = df_master[df_master['fund_id'] == fund_id].copy()
        if fund_navs.empty:
            continue

        fund_navs = fund_navs.sort_values('date').set_index('date')['nav']
        latest_date = fund_navs.index[-1]
        start_date = gp['date'].min()

        # ── 1. Get latest NAV ─────────────────────────────────────────────
        try:
            cd = fund_navs.index[fund_navs.index <= latest_date][-1]
            latest_nav = float(fund_navs.loc[cd])
        except IndexError:
            latest_nav = 0.0

        # ── 2. Simulate Actual User portfolio month-by-month ──────────────
        monthly_dates = pd.date_range(start=start_date, end=latest_date, freq='ME')
        actual_curve = []

        for month_end in monthly_dates:
            month_txns = gp[gp['date'] <= month_end]
            u = 0.0
            inv = 0.0
            for _, row in month_txns.iterrows():
                d = row['date']
                amt = float(row['amount'])
                typ = str(row['type']).strip().upper()
                try:
                    nd = fund_navs.index[fund_navs.index <= d][-1]
                    nav = float(fund_navs.loc[nd])
                except IndexError:
                    continue
                if typ == 'BUY':
                    u += amt / nav
                    inv += amt
                elif typ in ['SELL', 'REDEEM']:
                    u = max(0.0, u - amt / nav)
                    inv = max(0.0, inv - amt)

            try:
                nd2 = fund_navs.index[fund_navs.index <= month_end][-1]
                current_nav = float(fund_navs.loc[nd2])
            except IndexError:
                current_nav = 0.0

            actual_curve.append({
                "date": month_end.strftime("%Y-%m"),
                "actual": round(u * current_nav, 2),
            })

        # Final user state
        u = 0.0
        inv = 0.0
        for _, row in gp.iterrows():
            d = row['date']
            amt = float(row['amount'])
            typ = str(row['type']).strip().upper()
            try:
                nd = fund_navs.index[fund_navs.index <= d][-1]
                nav = float(fund_navs.loc[nd])
            except IndexError:
                continue
            if typ == 'BUY':
                u += amt / nav
                inv += amt
            elif typ in ['SELL', 'REDEEM']:
                u = max(0.0, u - amt / nav)
                inv = max(0.0, inv - amt)

        user_final_value = u * latest_nav
        user_total_invested = inv
        user_abs_return = (
            (user_final_value - user_total_invested) / user_total_invested * 100
            if user_total_invested > 0 else 0.0
        )

        # ── 3. Simulate Disciplined SIP month-by-month ────────────────────
        total_buys = gp[gp['type'].str.upper() == 'BUY']['amount'].sum()
        months_duration = max(1, len(monthly_dates))
        monthly_sip = total_buys / months_duration

        disc_dates = pd.date_range(start=start_date, end=latest_date, freq='MS')
        disc_units = 0.0
        disc_invested = 0.0
        disc_by_month: dict[str, float] = {}

        for d in disc_dates:
            try:
                nd = fund_navs.index[fund_navs.index <= d][-1]
                nav = float(fund_navs.loc[nd])
                disc_units += monthly_sip / nav
                disc_invested += monthly_sip
            except IndexError:
                pass
            try:
                month_end_d = d + pd.offsets.MonthEnd(0)
                nd2 = fund_navs.index[fund_navs.index <= month_end_d][-1]
                disc_by_month[d.strftime("%Y-%m")] = round(disc_units * float(fund_navs.loc[nd2]), 2)
            except Exception:
                disc_by_month[d.strftime("%Y-%m")] = 0.0

        disc_final_value = disc_units * latest_nav
        disc_abs_return = (
            (disc_final_value - disc_invested) / disc_invested * 100
            if disc_invested > 0 else 0.0
        )
        panic_tax = disc_final_value - user_final_value

        # ── 4. Merge curves ───────────────────────────────────────────────
        combined_curve = []
        for pt in actual_curve:
            combined_curve.append({
                "date": pt["date"],
                "actual": pt["actual"],
                "disciplined": disc_by_month.get(pt["date"], 0.0),
            })

        results.append({
            "fund_id": str(fund_id),
            "actual_invested": round(user_total_invested, 2),
            "actual_value": round(user_final_value, 2),
            "actual_return_perc": round(user_abs_return, 2),
            "disc_invested": round(disc_invested, 2),
            "disc_value": round(disc_final_value, 2),
            "disc_return_perc": round(disc_abs_return, 2),
            "panic_tax": round(panic_tax, 2),
            "is_panic_seller": bool(panic_tax > 0 and 'SELL' in gp['type'].str.upper().values),
            "curve": combined_curve,
        })

    return {"status": "success", "analysis": results}
