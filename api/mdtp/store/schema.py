import sqlalchemy

metadata = sqlalchemy.MetaData()

GridItemsTable = sqlalchemy.Table(
    'tbl_grid_items',
    metadata,
    sqlalchemy.Column(key='gridItemId', name='id', type_=sqlalchemy.Integer, autoincrement=True, primary_key=True, nullable=False),
    sqlalchemy.Column(key='createdDate', name='created_date', type_=sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(key='updatedDate', name='updated_date', type_=sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(key='network', name='network', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='tokenId', name='token_id', type_=sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column(key='contentUrl', name='content_url', type_=sqlalchemy.Text, nullable=True),
    sqlalchemy.Column(key='title', name='title', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='description', name='description', type_=sqlalchemy.Text, nullable=True),
    sqlalchemy.Column(key='imageUrl', name='image_url', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='resizableImageUrl', name='resizable_image_url', type_=sqlalchemy.Text, nullable=True),
    sqlalchemy.Column(key='url', name='url', type_=sqlalchemy.Text, nullable=True),
    sqlalchemy.Column(key='groupId', name='block_id', type_=sqlalchemy.Text, nullable=True),
    sqlalchemy.Column(key='ownerId', name='owner_id', type_=sqlalchemy.Text, nullable=True),
)

BaseImagesTable = sqlalchemy.Table(
    'tbl_base_images',
    metadata,
    sqlalchemy.Column(key='baseImageId', name='id', type_=sqlalchemy.Integer, autoincrement=True, primary_key=True, nullable=False),
    sqlalchemy.Column(key='createdDate', name='created_date', type_=sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(key='updatedDate', name='updated_date', type_=sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(key='network', name='network', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='url', name='url', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='generatedDate', name='generated_date', type_=sqlalchemy.DateTime, nullable=False),
)

NetworkUpdatesTable = sqlalchemy.Table(
    'tbl_network_updates',
    metadata,
    sqlalchemy.Column(key='networkUpdateId', name='id', type_=sqlalchemy.Integer, autoincrement=True, primary_key=True, nullable=False),
    sqlalchemy.Column(key='createdDate', name='created_date', type_=sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(key='updatedDate', name='updated_date', type_=sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(key='network', name='network', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='latestBlockNumber', name='latest_block_number', type_=sqlalchemy.Integer, nullable=False),
)
