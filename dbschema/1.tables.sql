CREATE TABLE tbl_grid_items (
    id BIGSERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    network TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    resizable_image_url TEXT,
    owner_id TEXT NOT NULL
);
CREATE UNIQUE INDEX tbl_grid_items_uq_token_id_network ON tbl_grid_items (token_id, network);
