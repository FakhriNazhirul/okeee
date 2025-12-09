import pandas as pd
import os

df = pd.read_csv("dinkes-od_17448_jml_penderita_diabetes_melitus_brdsrkn_kabupatenko_v2_data.csv")
df_2019 = df[df['tahun'] == 2019]
print(df_2019) 
