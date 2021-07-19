CREATE TABLE tbl_grid_items (
    id BIGSERIAL PRIMARY KEY,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    network TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    resizable_image_url TEXT,
    owner_id TEXT NOT NULL,
);
CREATE UNIQUE INDEX tbl_grid_items_uq_token_id_network ON tbl_grid_items (token_id, network);
CREATE INDEX tbl_grid_items_updated_date ON tbl_grid_items (updated_date);
CREATE INDEX tbl_grid_items_network ON tbl_grid_items (network);
CREATE INDEX tbl_grid_items_token_id ON tbl_grid_items (token_id);
CREATE INDEX tbl_grid_items_owner_id ON tbl_grid_items (owner_id);

CREATE TABLE tbl_base_images (
    id BIGSERIAL PRIMARY KEY,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    network TEXT NOT NULL,
    url TEXT NOT NULL,
    generated_date TIMESTAMP NOT NULL
);
CREATE INDEX tbl_base_images_updated_date ON tbl_base_images (updated_date);
CREATE INDEX tbl_base_images_network ON tbl_base_images (network);

CREATE TABLE tbl_network_updates (
    id BIGSERIAL PRIMARY KEY,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    network TEXT NOT NULL,
    latest_block_number INTEGER NOT NULL
);
CREATE UNIQUE INDEX tbl_network_updated_uq_network ON tbl_network_updated (network);
