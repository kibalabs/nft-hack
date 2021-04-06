import sqlalchemy

metadata = sqlalchemy.MetaData()

GridItemsTable = sqlalchemy.Table(
    'tbl_grid_items',
    metadata,
    sqlalchemy.Column(key='gridItemId', name='id', type_=sqlalchemy.Integer, autoincrement=True, primary_key=True, nullable=False),
    sqlalchemy.Column(key='tokenId', name='token_id', type_=sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column(key='network', name='network', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='title', name='title', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='description', name='description', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='imageUrl', name='image_url', type_=sqlalchemy.Text, nullable=False),
    sqlalchemy.Column(key='ownerId', name='owner_id', type_=sqlalchemy.Text, nullable=False),
)
