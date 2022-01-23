import React from 'react';

import { generateUUID } from '@kibalabs/core';
import { BackgroundView, Box, KibaIcon, Text, useColors } from '@kibalabs/ui-react';
import ReactTooltip from 'react-tooltip';


interface IBadgeProps{
  iconId: string;
  type?: string;
  hoverText?: string;
}

export const Badge = (props: IBadgeProps): React.ReactElement => {
  const badgeId = React.useMemo((): string => generateUUID(), []);
  const colors = useColors();
  return (
    <React.Fragment>
      <div data-tip data-for={badgeId}>
        <BackgroundView color={props.type === 'alert' ? '$colors.pastel9' : '$colors.pastel2'}>
          <Box variant='badge'>
            {/* <Text variant='light-uppercase-singleLine-extraSmall'>{props.text}</Text> */}
            <KibaIcon variant='small' iconId={props.iconId} _color={colors.lightText} />
          </Box>
        </BackgroundView>
      </div>
      {props.hoverText && (
        <ReactTooltip id={badgeId} effect='solid' backgroundColor={colors.backgroundLight10} border={true} borderColor={colors.backgroundDark10}>
          <Box maxWidth='300px'>
            <Text>{props.hoverText}</Text>
          </Box>
        </ReactTooltip>
      )}
    </React.Fragment>
  );
};
