import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  open: boolean
  title: ReactNode
  children: ReactNode
  /** 底部确定按钮文字，默认「确定」。设为 null 则不展示确定按钮 */
  confirmText?: string | null
  /** 底部取消按钮文字，默认「取消」。设为 null 则不展示取消按钮 */
  cancelText?: string | null
  confirmDisabled?: boolean
  confirmBusy?: boolean
  widthClassName?: string
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
  /** 隐藏默认 footer，由 children 自己提供按钮（弹框仅做遮罩容器） */
  hideFooter?: boolean
}

export default function Modal(props: ModalProps) {
  const {
    open,
    title,
    children,
    confirmText = '确定',
    cancelText = '取消',
    confirmDisabled,
    confirmBusy,
    widthClassName = 'max-w-2xl',
    onConfirm,
    onCancel,
    onClose,
    hideFooter,
  } = props

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ;(onCancel ?? onClose)?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel, onClose])

  if (!open) return null

  const node = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => (onCancel ?? onClose)?.()}
      />
      <div
        className={`relative z-10 w-full ${widthClassName} animate-fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card border-paperedge/20 p-0">
          <div className="flex items-center justify-between border-b border-paperedge/15 px-6 py-4">
            <h3 className="text-base font-bold tracking-[0.2em] text-paper">{title}</h3>
            <button
              type="button"
              className="rounded-sm px-2 py-1 text-paperdim/70 transition hover:bg-paperedge/10 hover:text-paper"
              onClick={() => (onCancel ?? onClose)?.()}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
          {!hideFooter && (
            <div className="flex items-center justify-end gap-3 border-t border-paperedge/15 px-6 py-4">
              {cancelText !== null && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => (onCancel ?? onClose)?.()}
                  disabled={confirmBusy}
                >
                  {cancelText}
                </button>
              )}
              {confirmText !== null && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onConfirm}
                  disabled={confirmDisabled || confirmBusy}
                >
                  {confirmBusy ? '保存中…' : confirmText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return node
  const mount = document.body
  return createPortal(node, mount)
}
