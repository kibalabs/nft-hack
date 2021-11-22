CREATE TABLE tbl_grid_items (
    id BIGSERIAL PRIMARY KEY,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    network TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    content_url TEXT, -- NOTE(krishan711): make this NOT NULL when filled
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    resizable_image_url TEXT,
    url TEXT,
    -- NOTE(krishan711): this should really be groupId
    block_id TEXT,
    owner_id TEXT NOT NULL
);
CREATE UNIQUE INDEX tbl_grid_items_uq_token_id_network ON tbl_grid_items (token_id, network);
CREATE INDEX tbl_grid_items_updated_date ON tbl_grid_items (updated_date);
CREATE INDEX tbl_grid_items_network ON tbl_grid_items (network);
CREATE INDEX tbl_grid_items_token_id ON tbl_grid_items (token_id);
CREATE INDEX tbl_grid_items_owner_id ON tbl_grid_items (owner_id);
CREATE INDEX tbl_grid_items_block_id ON tbl_grid_items (block_id);

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

CREATE TABLE tbl_offchain_contents (
    id BIGSERIAL PRIMARY KEY,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    network TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    content_url TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    owner_id TEXT NOT NULL,
    signature TEXT NOT NULL,
    signed_message TEXT NOT NULL
);
CREATE INDEX tbl_offchain_contents_updated_date ON tbl_offchain_contents (updated_date);
CREATE INDEX tbl_offchain_contents_network ON tbl_offchain_contents (network);
CREATE INDEX tbl_offchain_contents_token_id ON tbl_offchain_contents (token_id);
CREATE INDEX tbl_offchain_contents_block_number ON tbl_offchain_contents (block_number);
CREATE INDEX tbl_offchain_contents_owner_id ON tbl_offchain_contents (owner_id);

CREATE TABLE tbl_offchain_pending_contents (
    id BIGSERIAL PRIMARY KEY,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    applied_date TIMESTAMP,
    network TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    content_url TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    owner_id TEXT NOT NULL,
    signature TEXT NOT NULL,
    signed_message TEXT NOT NULL
);
CREATE INDEX tbl_offchain_pending_contents_updated_date ON tbl_offchain_pending_contents (updated_date);
CREATE INDEX tbl_offchain_pending_contents_applied_date ON tbl_offchain_pending_contents (applied_date);
CREATE INDEX tbl_offchain_pending_contents_network ON tbl_offchain_pending_contents (network);
CREATE INDEX tbl_offchain_pending_contents_token_id ON tbl_offchain_pending_contents (token_id);
CREATE INDEX tbl_offchain_pending_contents_block_number ON tbl_offchain_pending_contents (block_number);
CREATE INDEX tbl_offchain_pending_contents_owner_id ON tbl_offchain_pending_contents (owner_id);
