# SVG Sprite System

A high-performance, production-ready SVG sprite system for React applications with localStorage caching, version control, and TypeScript support.

## Features

- 🚀 **Performance Optimized**: localStorage caching with automatic cache invalidation
- 🔄 **Version Control**: Automatic cache busting when sprites are updated
- 🎯 **TypeScript Support**: Full type safety and IntelliSense
- 🛡️ **Error Handling**: Graceful fallbacks for failed loads
- ♿ **Accessibility**: Built-in ARIA support and keyboard navigation
- 🎨 **Flexible Styling**: Support for custom CSS classes and inline styles
- 📱 **Responsive**: Works with any size and responsive design
- 🔧 **Production Ready**: Comprehensive error boundaries and loading states

## Quick Start

### 1. Setup the SVG Sprite Loader

Wrap your app with the `SvgSpriteLoader` component:

```tsx
import { SvgSpriteLoader } from 'components/atoms/svg-sprite-loader';
import svgSprite from 'assets/images/svg/svg-sprite.svg';

function App() {
  return (
    <SvgSpriteLoader 
      url={svgSprite} 
      version="1.0.0"
      onLoad={() => console.log('SVG sprite loaded successfully')}
      onError={(error) => console.error('Failed to load SVG sprite:', error)}
    >
      {/* Your app content */}
    </SvgSpriteLoader>
  );
}
```

### 2. Use SVG Icons

Use the `SvgIcon` component throughout your app:

```tsx
import { SvgIcon } from 'components/atoms/svg-sprite-loader';

function MyComponent() {
  return (
    <div>
      {/* Basic usage */}
      <SvgIcon 
        name="home" 
        width="24" 
        height="24" 
        fill="currentColor"
      />
      
      {/* With click handler */}
      <SvgIcon 
        name="settings" 
        width="32" 
        height="32" 
        fill="currentColor"
        className="hover:text-blue-600 cursor-pointer"
        onClick={() => console.log('Settings clicked')}
      />
      
      {/* With custom styling */}
      <SvgIcon 
        name="star" 
        width="48" 
        height="48" 
        fill="currentColor"
        className="text-yellow-500 hover:text-yellow-600 transition-colors"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      />
    </div>
  );
}
```

## API Reference

### SvgSpriteLoader Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `url` | `string` | ✅ | - | URL to the SVG sprite file |
| `version` | `string` | ❌ | `"1.0.0"` | Version number for cache invalidation |
| `onLoad` | `() => void` | ❌ | - | Callback when sprite loads successfully |
| `onError` | `(error: Error) => void` | ❌ | - | Callback when sprite fails to load |
| `children` | `React.ReactNode` | ❌ | - | Child components |

### SvgIcon Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | ✅ | - | Icon name (must match symbol id in sprite) |
| `width` | `string \| number` | ❌ | `"24"` | Icon width |
| `height` | `string \| number` | ❌ | `"24"` | Icon height |
| `fill` | `string` | ❌ | `"currentColor"` | Fill color |
| `stroke` | `string` | ❌ | - | Stroke color |
| `strokeWidth` | `string \| number` | ❌ | - | Stroke width |
| `className` | `string` | ❌ | `""` | CSS classes |
| `onClick` | `(event: MouseEvent) => void` | ❌ | - | Click handler |
| `style` | `React.CSSProperties` | ❌ | - | Inline styles |
| `aria-label` | `string` | ❌ | - | Accessibility label |
| `aria-hidden` | `boolean` | ❌ | `false` | Hide from screen readers |

## Advanced Usage

### Using the Context Hook

Access the sprite loader state directly:

```tsx
import { useSvgSprite } from 'components/atoms/svg-sprite-loader';

function MyComponent() {
  const { isLoaded, isLoading, error, loadSprite } = useSvgSprite();
  
  if (isLoading) return <div>Loading sprites...</div>;
  if (error) return <div>Error loading sprites: {error.message}</div>;
  if (!isLoaded) return <div>Sprites not loaded</div>;
  
  return <div>Sprites are ready!</div>;
}
```

### Custom Cache Management

The system automatically handles caching, but you can clear cache manually:

```tsx
import { clearCachedSvgSprite } from 'utils/svgSpriteUtils';

// Clear cache for a specific sprite
clearCachedSvgSprite('https://example.com/sprites.svg');
```

### Creating SVG Sprites

Your SVG sprite file should follow this format:

```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none;">
  <symbol id="icon-name" viewBox="0 0 24 24">
    <path d="..." fill="currentColor"/>
  </symbol>
  <!-- More symbols... -->
</svg>
```

## Performance Tips

1. **Optimize SVG files**: Remove unnecessary attributes and compress your sprites
2. **Version control**: Update the version prop when you update your sprite file
3. **Preload critical icons**: Consider preloading icons that appear above the fold

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Icons not showing
- Check that the sprite is loaded successfully
- Verify the icon name matches the symbol id in your sprite
- Ensure the viewBox is correct

### Cache issues
- Clear localStorage or update the version prop
- Check browser developer tools for console errors

### Performance issues
- Ensure your sprite file is optimized
- Consider splitting large sprites into smaller chunks
- Use appropriate cache expiry settings

## License

MIT License - feel free to use in your projects!
