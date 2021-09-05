import React from 'react';

import { Alignment, Button, Direction, IconButton, KibaIcon, MultiLineInput, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface IShareFormProps {
  initialShareText: string;
  minRowCount: number;
  isAllOptionsEnabled: boolean;
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
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} isFullWidth={true}>
      <Text alignment={TextAlignment.Center}>{'❤️ Share with your friends and followers ❤️'}</Text>
      <MultiLineInput
        value={shareText}
        onValueChanged={setShareText}
        minRowCount={props.minRowCount}
      />
      <Button variant='primary' text='Tweet' iconLeft={<KibaIcon iconId='ion-logo-twitter' />} target={`https://twitter.com/intent/tweet?text=${getShareText()}`} />
      <Spacing />
      { props.isAllOptionsEnabled && (
        <React.Fragment>
          <Text alignment={TextAlignment.Center}>{'Some other sharing options you might like!'}</Text>
          <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
            <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={`https://api.whatsapp.com/send/?phone&text=${getShareText()}`} />
            <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-reddit' />} target={`https://www.reddit.com/submit?url=${getShareLink()}&title=${getShareText()}`} />
            <IconButton variant='primary' icon={<KibaIcon iconId='ion-mail' />} target={`mailto:%20?subject=${getShareLink()}&body=${getShareText()}`} />
          </Stack>
        </React.Fragment>
      )}
    </Stack>
  );
};
