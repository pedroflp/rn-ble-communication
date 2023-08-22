import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

export default function Button({
  children,
  onPress,
  style,
  ...props
}: {
  children: React.ReactNode;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
} & TouchableOpacityProps) {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#000',
      padding: 12,
      borderRadius: 8,
    },
    text: {
      color: '#fff',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity
      {...props}
      style={[styles.container, style]}
      onPress={onPress}>
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}
