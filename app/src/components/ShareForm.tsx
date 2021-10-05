import React from 'react';

import { Alignment, Button, Direction, IconButton, KibaIcon, MultiLineInput, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface IShareFormProps {
  initialShareText: string;
  minRowCount?: number;
  isSecondaryAction?: boolean;
}

export const ShareForm = (props: IShareFormProps): React.ReactElement => {
  const [shareText, setShareText] = React.useState<string>(props.initialShareText);

  const getShareText = (): string => {
    return encodeURIComponent(shareText);
  };

  const getShareLink = (): string => {
    return encodeURIComponent('https://milliondollartokenpage.com');
  };

  return (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} isFullWidth={true}>
      <Text alignment={TextAlignment.Center}>{'❤️ Share with your friends and followers ❤️'}</Text>
      <MultiLineInput
        value={shareText}
        onValueChanged={setShareText}
        minRowCount={props.minRowCount}
      />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true}>
        <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={`https://api.whatsapp.com/send/?phone&text=${getShareText()}`} />
        <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-facebook' />} target={`https://www.facebook.com/sharer/sharer.php?u=${getShareLink()}`} />
        <IconButton variant='primary' icon={<KibaIcon iconId='ion-mail' />} target={`mailto:%20?subject=${getShareLink()}&body=${getShareText()}`} />
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <Button variant={props.isSecondaryAction ? 'secondary' : 'primary'} text='Tweet' iconLeft={<KibaIcon iconId='ion-logo-twitter' />} target={`https://twitter.com/intent/tweet?text=${getShareText()}`} />
        </Stack.Item>
      </Stack>
    </Stack>
  );
};
