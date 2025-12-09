harga_awal = 12000
terjual_awal = 10
kenaikan = 3
harga_naik = 1000
total_pendapatan = 0
total_nasi = 0

terjual_hari_ini = terjual_awal

for i in range(6):
    jumlah_harga_hari = harga_awal + (harga_awal*i)
    jumlah_terjual = terjual_awal + (kenaikan*i)
    print(f"ini adalah harga satuan {jumlah_harga_hari}")
    print(f"ini total terjual harian {jumlah_terjual}")
    pendapatan_harian = terjual_hari_ini * jumlah_harga_hari
    print(f"ini adalah pendapatan harian :{pendapatan_harian}")
    akumulasi_harga = terjual_hari_ini * (pendapatan_harian + i)
    # kenaikan = 
print(f"ini adalah akumulasi harganya {akumulasi_harga}")