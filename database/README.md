# LaundryHub Database

Import `laundryhub_mysql.sql` lewat Laragon/phpMyAdmin:

1. Start Apache dan MySQL di Laragon.
2. Buka `http://localhost/phpmyadmin`.
3. Pilih menu Import, lalu pilih `database/laundryhub_mysql.sql`.
4. Jalankan import. Database `laundryhub` akan dibuat otomatis.

File `laundryhub_connection.php` memakai default Laragon:

- host: `127.0.0.1`
- port: `3306`
- database: `laundryhub`
- user: `root`
- password: kosong

Untuk produksi, ganti password dan simpan hash password asli dengan `password_hash()`.
