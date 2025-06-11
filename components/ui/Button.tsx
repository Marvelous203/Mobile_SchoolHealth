import React from "react"
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    type TextStyle,
    TouchableOpacity,
    View,
    type ViewStyle,
} from "react-native"

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: "primary" | "secondary" | "outline" | "danger"
  size?: "small" | "medium" | "large"
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  icon?: React.ReactNode
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    let baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`${size}Button`],
    }

    if (fullWidth) {
      baseStyle.width = "100%"
    }

    switch (variant) {
      case "primary":
        baseStyle = { ...baseStyle, ...styles.primaryButton }
        break
      case "secondary":
        baseStyle = { ...baseStyle, ...styles.secondaryButton }
        break
      case "outline":
        baseStyle = { ...baseStyle, ...styles.outlineButton }
        break
      case "danger":
        baseStyle = { ...baseStyle, ...styles.dangerButton }
        break
    }

    if (disabled) {
      baseStyle = { ...baseStyle, ...styles.disabledButton }
    }

    return baseStyle
  }

  const getTextStyle = () => {
    let baseStyle: TextStyle = {
      ...styles.buttonText,
      ...styles[`${size}Text`],
    }

    switch (variant) {
      case "primary":
        baseStyle = { ...baseStyle, ...styles.primaryText }
        break
      case "secondary":
        baseStyle = { ...baseStyle, ...styles.secondaryText }
        break
      case "outline":
        baseStyle = { ...baseStyle, ...styles.outlineText }
        break
      case "danger":
        baseStyle = { ...baseStyle, ...styles.dangerText }
        break
    }

    if (disabled) {
      baseStyle = { ...baseStyle, ...styles.disabledText }
    }

    return baseStyle
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "outline" ? "#1890ff" : "#fff"} />
      ) : (
        <React.Fragment>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </React.Fragment>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mediumButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: "#1890ff",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1890ff",
  },
  dangerButton: {
    backgroundColor: "#ff4d4f",
  },
  disabledButton: {
    backgroundColor: "#d9d9d9",
    borderColor: "#d9d9d9",
  },
  buttonText: {
    fontWeight: "500",
    textAlign: "center",
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#000",
  },
  outlineText: {
    color: "#1890ff",
  },
  dangerText: {
    color: "#fff",
  },
  disabledText: {
    color: "#999",
  },
  iconContainer: {
    marginRight: 8,
  },
})
