import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = any

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

type ToastActionElement = React.ReactElement

type ToastProps = {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: ToastActionElement
}

const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST",
} as const

let memoryState: any = { toasts: [] }

function dispatch(action: any) {
    memoryState = {
        ...memoryState,
        toasts: action.toasts || memoryState.toasts
    }
}

function toast({ ...props }: Omit<ToastProps, "id">) {
    const id = genId()

    const update = (props: ToasterToast) =>
        dispatch({
            type: actionTypes.UPDATE_TOAST,
            toast: { ...props, id },
        })
    const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

    dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open: boolean) => {
                if (!open) dismiss()
            },
        },
    })

    return {
        id: id,
        dismiss,
        update,
    }
}

function useToast() {
    const [state, setState] = React.useState<any>(memoryState)

    React.useEffect(() => {
        setState(memoryState)
    }, [memoryState])

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    }
}

export { useToast, toast }
