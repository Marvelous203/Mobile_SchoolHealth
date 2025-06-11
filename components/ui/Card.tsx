import type React from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: "default" | "outlined" | "elevated"
}

export const Card: React.FC<CardProps> = ({ children, style, variant = "default" }) => {
  const getCardStyle = () => {
    let baseStyle: ViewStyle = { ...styles.card }

    switch (variant) {
      case "default":
        baseStyle = { ...baseStyle }
        break
      case "outlined":
        baseStyle = { ...baseStyle, ...styles.outlinedCard }
        break
      case "elevated":
        baseStyle = { ...baseStyle, ...styles.elevatedCard }
        break
    }

    return baseStyle
  }

  return <View style={[getCardStyle(), style]}>{children}</View>
}

interface CardHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>
}

interface CardContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>
}

interface CardFooterProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  return <View style={[styles.cardFooter, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  elevatedCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardContent: {
    padding: 16,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
})
