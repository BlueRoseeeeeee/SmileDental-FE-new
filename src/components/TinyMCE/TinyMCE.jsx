/**
 * @author: HoTram  
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

import { 
  TINYMCE_CONFIG_NEW, 
  TINYMCE_KEY,
  BASE_CDN_TINYMCE_URL
} from './constants';

import './styles.css';

const TinyMCE = ({
  containerClassName = '',
  containerStyle = {},
  onChangeText,
  isMarginTop = false,
  disabled = false,
  require = false,
  label = '',
  value = '',
  onChange,
  placeholder = ''
}) => {
  const [isUseSelfHost, setIsUseSelfHost] = useState(true);
  const [editor, setEditor] = useState(null);
  const [flag, setFlag] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (flag && editor) {
      console.log('TinyMCE initialized!', editor?.id);
      editorRef.current = editor;
      setFlag(false);
    }
  }, [flag, editor]);

  const scriptSrc = useMemo(() => {
    if (!isUseSelfHost) {
      return undefined;
    }
    return BASE_CDN_TINYMCE_URL;
  }, [isUseSelfHost]);

  const apiKey = useMemo(() => {
    if (isUseSelfHost) {
      return undefined;
    }
    return TINYMCE_KEY;
  }, [isUseSelfHost]);

  const handleOnChangeText = (newValue) => {
    if (onChange && typeof onChange === 'function') {
      onChange(newValue);
    }
    if (onChangeText && typeof onChangeText === 'function') {
      onChangeText(newValue);
    }
  };

  const handleOnInit = (evt, editorInstance) => {
    setEditor(editorInstance);
    setFlag(true);
  };

  const handleOnLoadError = () => {
    if (isUseSelfHost) {
      console.error('Failed to load self-hosted TinyMCE, falling back to cloud version');
      setIsUseSelfHost(false);
    }
  };

  return (
    <div
      className={`${containerClassName} smile-dental-tiny-mce`}
      style={{
        marginTop: isMarginTop ? 10 : 0,
        ...containerStyle,
      }}
    >
      {label && (
        <label className="tiny-mce-label">
          {label}
          {require && <span className="required">*</span>}
        </label>
      )}
      
      <Editor
        onScriptsLoadError={handleOnLoadError}
        key={`use-self-host-${isUseSelfHost}`}
        onEditorChange={handleOnChangeText}
        tinymceScriptSrc={scriptSrc}
        disabled={disabled}
        licenseKey="gpl"
        apiKey={apiKey}
        value={value}
        init={{
          init_instance_callback: handleOnInit,
          toolbar_mode: 'scrolling',
          height: 400,
          placeholder: placeholder,
          ...TINYMCE_CONFIG_NEW,
        }}
      />
    </div>
  );
};

TinyMCE.displayName = 'TinyMCE';

export default TinyMCE;
