from __future__ import annotations
import pandas as pd
import numpy as np
from pathlib import Path
from engines.behavior_engine import _load_data as get_master_data

def evaluate_portfolio(file_content: bytes) -> dict:
    """
    Evaluates an uploaded CSV of transactions.
    Expected CSV columns: Date, Type (Buy/Sell), Amount, Fund
    Example format:
      Date,Type,Amount,Fund
      2020-01-15,Buy,5000,R001
      2020-03-20,Sell,20000,R001
      2020-06-10,Buy,10000,R001
    """
    import io
    df_trans = pd.read_csv(io.BytesIO(file_content))

    # Normalize headers
    df_trans.columns = [c.strip().lower() for c in df_trans.columns]
    if not all(col in df_trans.columns for col in ['date', 'type', 'amount', 'fund']):
        return {"error": "Invalid CSV format. Required columns: Date, Type, Amount, Fund"}

    df_trans['date'] = pd.to_datetime(df_trans['date'])
    df_trans = df_trans.sort_values('date')

    # Get master data
    df_master = get_master_data()
    df_master['date'] = pd.to_datetime(df_master['date'])

    results = []

    # Process fund by fund
    for fund_id, gp in df_trans.groupby('fund'):
        fund_navs = df_master[df_master['fund_id'] == fund_id].copy()
        if fund_navs.empty:
            continue

        fund_navs = fund_navs.sort_values('date').set_index('date')['nav']

        # 1. Calculate Actual User Performance
        user_units = 0.0
        user_total_invested = 0.0
        for _, row in gp.iterrows():
            d = row['date']
            amt = float(row['amount'])
            typ = str(row['type']).strip().upper()

            # Find closest NAV date (exact match usually, but fallback to nearest before)
            try:
                closest_date = fund_navs.index[fund_navs.index <= d][-1]
                nav = fund_navs.loc[closest_date]
            except IndexError:
                continue # Transaction before our data starts

            if typ == 'BUY':
                user_units += amt / nav
                user_total_invested += amt
            elif typ in ['SELL', 'REDEEM']:
                # Simplify: assume amount implies withdrawing that specific cash value
                units_sold = amt / nav
                user_units = max(0, user_units - units_sold)
                user_total_invested = max(0, user_total_invested - amt) # rough tracking

        # User final value
        latest_date = fund_navs.index[-1]
        latest_nav = fund_navs.loc[latest_date]
        user_final_value = user_units * latest_nav
        user_abs_return = ((user_final_value - user_total_invested) / user_total_invested * 100) if user_total_invested > 0 else 0

        # 2. Calculate Disciplined Baseline
        # Sum all BUY amounts and spread them evenly across all months between first transaction and today
        total_buys = gp[gp['type'].str.upper() == 'BUY']['amount'].sum()
        start_date = gp['date'].min()
        months_duration = (latest_date.year - start_date.year) * 12 + latest_date.month - start_date.month
        months_duration = max(1, months_duration)

        monthly_sip = total_buys / months_duration
        disc_units = 0.0
        disc_invested = 0.0

        # Simulate SIP on 1st of every month
        disc_dates = pd.date_range(start=start_date, end=latest_date, freq='MS')
        for d in disc_dates:
            try:
                closest_date = fund_navs.index[fund_navs.index <= d][-1]
                nav = fund_navs.loc[closest_date]
                disc_units += monthly_sip / nav
                disc_invested += monthly_sip
            except IndexError:
                pass

        disc_final_value = disc_units * latest_nav
        disc_abs_return = ((disc_final_value - disc_invested) / disc_invested * 100) if disc_invested > 0 else 0

        panic_tax = disc_final_value - user_final_value

        results.append({
            "fund_id": str(fund_id),
            "actual_invested": round(user_total_invested, 2),
            "actual_value": round(user_final_value, 2),
            "actual_return_perc": round(user_abs_return, 2),
            "disc_invested": round(disc_invested, 2),
            "disc_value": round(disc_final_value, 2),
            "disc_return_perc": round(disc_abs_return, 2),
            "panic_tax": round(panic_tax, 2),
            "is_panic_seller": panic_tax > 0 and 'SELL' in gp['type'].str.upper().values
        })

    return {"status": "success", "analysis": results}
