CREATE USER mdtp_api;
GRANT USAGE ON SCHEMA public TO mdtp_api;
GRANT INSERT, SELECT, UPDATE ON tbl_grid_items TO mdtp_api;
GRANT ALL ON SEQUENCE tbl_grid_items_id_seq TO mdtp_api;
