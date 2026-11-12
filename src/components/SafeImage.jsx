import { useState } from 'react'

// An image that fades in when loaded and falls back to a warm block if it fails
const SafeImage = ({ src, alt, className = '', imgClassName = '' }) => {
    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)

    return (
        <div className={`relative overflow-hidden bg-surface ${className}`}>
            {!failed && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    className={`h-full w-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
                />
            )}
            {failed && (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-haldi-soft to-surface">
                    <span className="font-serif text-muted">{alt}</span>
                </div>
            )}
        </div>
    )
}

export default SafeImage
