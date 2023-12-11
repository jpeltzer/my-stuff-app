import { Button, FlatList, Image, StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';

import EditScreenInfo from '../../components/EditScreenInfo';

import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const imgDir = FileSystem.documentDirectory + 'images/'

const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(imgDir)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true })
  }
}

export default function TabOneScreen() {

  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    await ensureDirExists()
    const files = await FileSystem.readDirectoryAsync(imgDir)
    if (files.length > 0) {
      setImages(files.map(f => imgDir + f))
      console.log(images)
    }
  }

  const selectImage = async (useLibrary: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75
    }
    if (useLibrary) {
      result = await ImagePicker.launchImageLibraryAsync(options)
    } else {
      await ImagePicker.requestCameraPermissionsAsync()
      result = await ImagePicker.launchCameraAsync(options)
    }

    if (!result.canceled) {
      saveImage(result.assets[0].uri)
    }
  }

  const saveImage = async (uri: string) => {
    await ensureDirExists()
    const filename = new Date().getTime() + '.jpg'
    const dest = imgDir + filename
    await FileSystem.copyAsync({ from: uri, to: dest })
    setImages([...images, dest])
  }

  const uploadImage = async (uri: string) => {
    setLoading(true)
    const x = await FileSystem.uploadAsync('http://localhost/fileUploads/upload.php', uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
    })
    console.log(x)
    setLoading(false)
  }

  const deleteImage = async (uri: string) => {
    await FileSystem.deleteAsync(uri)
    setImages(images.filter((i) => i !== uri))
  }

  const renderItem = ({ item }: { item: string }) => {
    const filename = item.split('/').pop()
    return (
      <View style={{ flexDirection: 'row', margin: 1, alignItems: 'center', gap: 5 }}>
        <Image source={{ uri: item }} style={{ width: 100, height: 100 }}></Image>
        <Text style={{ flex: 1 }}>{filename}</Text>
        <Ionicons.Button name="cloud-upload" onPress={() => uploadImage(item)} />
        <Ionicons.Button name="trash" onPress={() => deleteImage(item)} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, gap: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 }}>
        <Button title="Photo Library" onPress={() => selectImage(true)} />
        <Button title="Camera Image" onPress={() => selectImage(false)} />
      </View>

      {/* <ScrollView>
        {images.map((img) => (
          <Image key={img} source={{ uri: img }} style={{ width: 300, height: 300, alignSelf: 'center' }} />
        ))}
      </ScrollView> */}

      <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '500' }}>My Images</Text>
      <FlatList data={images} renderItem={renderItem}></FlatList>

      {loading && (
        <View style={[StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        ]}>
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      )}

    </View>

    // <View style={styles.container}>
    //   <Text style={styles.title}>Tab One</Text>
    //   <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
    //   <EditScreenInfo path="app/(tabs)/index.tsx" />
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
