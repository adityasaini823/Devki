import { StyleSheet, Text, View } from 'react-native';
import { SearchBar } from 'react-native-elements';
export default function Store() {
  return (
    <View style={styles.container}>
    
      <SearchBar
        placeholder="Search for products..."
        lightTheme
        round
        platform='android'
        containerStyle={{ backgroundColor: '#FFFFFF', borderTopWidth: 0, borderBottomWidth: 0, borderRadius: 10 , margin: 10 }}
        inputContainerStyle={{ backgroundColor: '#FFFFFF', borderRadius: 30 , borderColor:"black", borderWidth: 1}}
        inputStyle={{ color: '#000' }}

      />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: '#ffffff', width: '90%', marginTop: 20, borderRadius: 10, padding: 20 }}>
        <View>
          <Text >Welcome to the Store!</Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <Text >Browse and purchase your favorite products.</Text>
        </View>
        
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
