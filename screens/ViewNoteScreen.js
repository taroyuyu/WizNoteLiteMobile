import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
} from 'react-native';
import { ColorSchemeProvider, useDynamicValue, DynamicStyleSheet } from 'react-native-dynamic';
import ImagePicker from 'react-native-image-picker';

import ThemedStatusBar from '../components/ThemedStatusBar';
import { Navigation } from '../thirdparty/react-native-navigation';
import NoteEditor from '../components/NoteEditor';

import { enableNextAnimation } from '../services/animations';
import { getDeviceDynamicColor, getColor } from '../config/Colors';
import dataStore from '../data_store';
import api from '../api';

const ViewNoteScreen: () => React$Node = (props) => {
  const styles = useDynamicValue(dynamicStyles);
  const editorRef = useRef(null);

  async function handleInsertImage() {
    //
    try {
      const js = 'window.onBeforeInsert();true;';
      await editorRef.current.injectJavaScript(js);
    } catch (err) {
      console.log(err);
    }
    //
    const options = {
      title: 'Select Image',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    ImagePicker.showImagePicker(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.error(`ImagePicker Error: ${response.error?.message}`);
      } else if (response.customButton) {
        console.log(`User tapped custom button: ${response.customButton}`);
      } else {
        //
        console.log(response.type);
        //
        const note = dataStore.getCurrentNote();
        let resourceUrl;
        if (response.uri) {
          resourceUrl = await api.addImageFromUrl(note.kbGuid, note.guid, response.uri);
        } else if (response.data) {
          const type = response.type;
          resourceUrl = await api.addImageFromData(note.kbGuid, note.guid, response.data, {
            base64: true,
            type: {
              ext: type.substr(6),
              mime: type,
            },
          });
        }
        if (resourceUrl) {
          if (editorRef.current) {
            const js = `window.addImage('${resourceUrl}');true;`;
            try {
              await editorRef.current.injectJavaScript(js);
            } catch (err) {
              console.log(err.message);
            }
          }
        }
      }
    });
  }

  useEffect(() => {
    const listener = Navigation.events().registerNavigationButtonPressedListener(({ buttonId }) => {
      if (buttonId === 'DoneButton') {
        Navigation.dismissModal(props.componentId);
      } else if (buttonId === 'InsertImageButton') {
        handleInsertImage();
      }
    });
    return () => listener.remove();
  }, []);

  const oldMarkdownRef = useRef('');
  useEffect(() => {
    //
    if (!props.isNewNote) {
      return undefined;
    }
    const note = dataStore.getCurrentNote();
    (async () => {
      oldMarkdownRef.current = await api.getNoteMarkdown(note.kbGuid, note.guid);
    })();
    //
    return () => {
      (() => {
        setTimeout(async () => {
          const markdown = await api.getNoteMarkdown(note.kbGuid, note.guid);
          if (oldMarkdownRef.current === markdown) {
            enableNextAnimation();
            await api.deleteNote(note.kbGuid, note.guid);
          }
        }, 500);
      })();
    };
  }, []);

  function handleBeginEditing() {
    Navigation.mergeOptions(props.componentId, {
      topBar: {
        rightButtons: [{
          id: 'InsertImageButton',
          // eslint-disable-next-line import/no-unresolved
          icon: require('../images/icons/insert_image.png'),
        }],
      },
    });
  }

  function handleEndEditing() {
    Navigation.mergeOptions(props.componentId, {
      topBar: {
        rightButtons: [],
      },
    });
  }

  function handleThemeChanged(themeName) {
    // force update buttons color
    console.log('update view note screen theme');
    Navigation.mergeOptions(props.componentId, {
      topBar: {
        background: {
          color: getColor('topBarBackground'),
        },
      },
    });
  }

  return (
    <ColorSchemeProvider>
      <ThemedStatusBar onThemeChanged={handleThemeChanged} />
      <SafeAreaView style={styles.content}>
        <NoteEditor
          ref={editorRef}
          containerStyle={styles.editorContainer}
          style={styles.editor}
          onBeginEditing={handleBeginEditing}
          onEndEditing={handleEndEditing}
        />
      </SafeAreaView>
    </ColorSchemeProvider>
  );
};

ViewNoteScreen.options = {
  topBar: {
    noBorder: true,
    title: {
    },
  },
  bottomTabs: {
    visible: false,
  },
  animations: {
    push: {
      waitForRender: true,
    },
  },
  layout: {
    orientation: ['portrait'],
  },
};

const dynamicStyles = new DynamicStyleSheet({
  content: {
    display: 'flex',
    flex: 1,
    backgroundColor: getDeviceDynamicColor('noteBackground'),
  },
  editorContainer: {
    flex: 1,
    backgroundColor: getDeviceDynamicColor('noteBackground'),
  },
  editor: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: getDeviceDynamicColor('noteBackground'),
  },
});

export default ViewNoteScreen;
