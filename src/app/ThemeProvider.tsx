import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useRestaurant } from '../hooks/useRestaurant'
import {
  applyAppearanceToDocument,
  parseAppearanceConfig,
  type AppearanceConfig,
} from '../lib/appearance'

type ThemeContextValue = {
  appearance: AppearanceConfig
  loading: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  appearance: { themeMode: 'light', accentPreset: 'green' },
  loading: true,
})

export const useThemeSettings = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { restaurant, loading } = useRestaurant()

  const appearance = useMemo(
    () =>
      parseAppearanceConfig(
        restaurant?.settings?.configuracion_general,
        restaurant?.settings?.color_primario
      ),
    [restaurant?.settings?.configuracion_general, restaurant?.settings?.color_primario]
  )

  useEffect(() => {
    if (!loading) {
      applyAppearanceToDocument(appearance)
    }
  }, [appearance, loading])

  return (
    <ThemeContext.Provider value={{ appearance, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}
