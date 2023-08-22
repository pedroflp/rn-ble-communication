import React from 'react';
import {StyleSheet, View} from 'react-native';

export const Column = ({children}: any) => {
  const styles = StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
  });
  return <View style={styles.container}>{children}</View>;
};
