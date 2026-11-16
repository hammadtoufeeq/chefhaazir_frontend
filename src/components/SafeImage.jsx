import { useState } from 'react'

// An image that fades in once loaded and falls back to a warm block if it fails
const SafeImage = ({ src, alt, className = '', imgClassName = '', eager = false }) => {
    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-rust-soft to-sand ${className}`}>
            {!failed && (
                <img
                    src={src}
                    alt={alt}
                    loading={eager ? 'eager' : 'lazy'}
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    className={`h-full w-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
                />
            )}
        </div>
    )
}

export default SafeImage
