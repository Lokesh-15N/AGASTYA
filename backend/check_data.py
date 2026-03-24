import pandas as pd
df = pd.read_csv('data/master_data.csv')
print(f'Total rows: {len(df):,}')
print(f'Total funds: {df.fund_id.nunique()}')
print(f'Date range: {df.date.min()} → {df.date.max()}')
print()
for (fid, name), g in df.groupby(['fund_id','fund_name']):
    print(f"  {fid} | {name[:40]:<40} | {g.date.min()} → {g.date.max()} | {len(g):,} rows")
