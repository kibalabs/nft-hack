import React from 'react';

import { IImageProps, Image } from '@kibalabs/ui-react';

export const MdtpImage = (props: IImageProps): React.ReactElement => {
  const source = props.source.startsWith('ipfs://') ? props.source.replace('ipfs://', 'https://ipfs.infura.io/ipfs/') : props.source;
  return (
    <Image {...props} source={source} />
  );
};
