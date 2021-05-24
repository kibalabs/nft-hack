
import React from 'react';

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
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: #ccc;
  border-style: dashed;
  background-color: #eee;
  color: #bdbdbd;
  outline: none;
  transition: border .24s ease-in-out;
`;

export const Dropzone = (props: IDropzoneProps): React.ReactElement => {
  const onDrop = React.useCallback((files: File[]) => {
    props.onFilesChosen(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onFilesChosen]);

  const { getRootProps, getInputProps, isDragActive } = ReactDropzone.useDropzone({ onDrop, maxFiles: 1, accept: ['image/png', 'image/jpeg', 'image/jpg'] });

  return (
    <StyledDropzone {...getRootProps()} style={{ padding: '20px' }}>
      <input {...getInputProps()} />
      { isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag and drop an image here, or click to select a file</p>
      )}
    </StyledDropzone>
  );
};
