import React from 'react';

import { Direction, MarkdownText, Stack, Text } from '@kibalabs/ui-react';

export type KeyValueProps = {
  name: string;
  nameTextVariant?: string;
  value?: string | null;
  markdownValue?: string | null;
  valueTextVariant?: string;
  emptyValueText?: string;
  emptyValueTextVariant?: string;
};

export const KeyValue = (props: KeyValueProps): React.ReactElement => {
  const nameTextVariant = props.nameTextVariant || 'bold';
  const valueTextVariant = props.valueTextVariant || '';
  const emptyValueText = props.emptyValueText || 'none';
  const emptyValueTextVariant = props.emptyValueTextVariant || 'light';
  return (
    <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
      <Text variant={nameTextVariant}>{`${props.name}:`}</Text>
      <Stack.Item growthFactor={1}>
        { props.value != null ? (
          <Text variant={valueTextVariant}>{props.value}</Text>
        ) : props.markdownValue != null ? (
          <MarkdownText textVariant={valueTextVariant} source={props.markdownValue} />
        ) : (
          <Text variant={emptyValueTextVariant}>{emptyValueText}</Text>
        )}
      </Stack.Item>
    </Stack>
  );
};
