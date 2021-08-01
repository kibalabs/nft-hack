
import React from 'react';

import { Text } from '@kibalabs/ui-react';
import * as ReactDropzone from 'react-dropzone';
import styled from 'styled-components';

export interface IDropzoneProps {
  onFilesChosen: (files: File[]) => void;
}

const StyledDropzone = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5em 0.5em;
  border-width: 2px;
  border-radius: 2px;
  border-color: #ccc;
  border-style: dashed;
  background-color: #eee;
  outline: none;
  cursor: pointer;
  transition: border .24s ease-in-out;
`;

export const Dropzone = (props: IDropzoneProps): React.ReactElement => {
  const onDrop = React.useCallback((files: File[]) => {
    props.onFilesChosen(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onFilesChosen]);

  const { getRootProps, getInputProps } = ReactDropzone.useDropzone({ onDrop, maxFiles: 1, accept: ['image/png', 'image/jpeg', 'image/jpg'] });

  return (
    <StyledDropzone {...getRootProps()}>
      <input {...getInputProps()} />
      <Text variant='note'>UPLOAD</Text>
    </StyledDropzone>
  );
};
