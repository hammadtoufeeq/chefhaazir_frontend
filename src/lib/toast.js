const emitToast = (type, message, title) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('chefhaazir:toast', { detail: { type, message, title } }))
}

const toast = {
    success: (message, title = 'Success') => emitToast('success', message, title),
    error: (message, title = 'Something went wrong') => emitToast('error', message, title)
}

export default toast
