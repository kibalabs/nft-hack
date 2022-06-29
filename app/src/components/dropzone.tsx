
import React from 'react';

import { ITheme, KibaIcon, useTheme, valueToCss } from '@kibalabs/ui-react';
import * as ReactDropzone from 'react-dropzone';
import styled from 'styled-components';

export interface IDropzoneProps {
  className?: string;
  onFilesChosen: (files: File[]) => void;
}

interface IStyledDropzoneProps {
  theme: ITheme;
}

const StyledDropzone = styled.div<IStyledDropzoneProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5em 1em;
  border-width: 0.1em;
  border-radius: ${(props: IStyledDropzoneProps): string => valueToCss(props.theme.dimensions.borderRadius)};
  border-color: #ccc;
  border-style: dashed;
  background-color: #eee;
  justify-content: center;
  outline: none;
  cursor: pointer;
  transition: border .24s ease-in-out;
`;

export const Dropzone = (props: IDropzoneProps): React.ReactElement => {
  const theme = useTheme();
  const onDrop = React.useCallback((files: File[]) => {
    props.onFilesChosen(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onFilesChosen]);

  const { getRootProps, getInputProps } = ReactDropzone.useDropzone({ onDrop,
    maxFiles: 1,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/jpg': [] } });

  return (
    <StyledDropzone className={props.className} theme={theme} {...getRootProps()}>
      <input {...getInputProps()} />
      <KibaIcon iconId='ion-cloud-upload-outline' />
    </StyledDropzone>
  );
};
