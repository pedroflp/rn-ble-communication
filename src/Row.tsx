import React from 'react';
import {StyleSheet, View} from 'react-native';

export const Row = ({children}: any) => {
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
  });
  return <View style={styles.container}>{children}</View>;
};
