<script setup lang="ts">
export interface DialogProps {
  modelValue?: boolean
  visible?: boolean
  zIndex?: number
  closeByMask?: boolean
  useVIf?: boolean
  transition?: boolean
  transitionName?: string
}

export interface DialogEmits {
  (e: 'close'): void
  (e: 'update:modelValue', value: boolean): void
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DialogProps>(), {
  visible: false,
  zIndex: 100,
  closeByMask: true,
  useVIf: true,
  transition: true,
  transitionName: 'dialog-visible',
})

const emit = defineEmits<DialogEmits>()

const visible = computed(() => props.modelValue || props.visible)

const elDialogRoot = ref<HTMLDivElement>()
const elDialogContent = ref<HTMLDivElement>()

function close() {
  if (visible.value) {
    emit('close')
    emit('update:modelValue', false)
  }
}

function clickMask() {
  if (props.closeByMask)
    close()
}

const isVIf = computed(() => props.useVIf ? visible.value : true)
const isVShow = computed(() => !props.useVIf ? visible.value : true)

useEventListener('keydown', (e) => {
  if (visible.value && e.key === 'Escape') {
    close()
    e.preventDefault()
  }
})
</script>

<template>
  <teleport to="body">
    <Transition name="dialog-visible">
      <div
        v-if="isVIf" v-show="isVShow" ref="elDialogRoot" data-scope="dialog-root"
        class="scrollbar-none fixed inset-0 of-y-auto overscroll-none" :style="{ zIndex }"
      >
        <div class="fixed inset-0 z-0 touch-none backdrop-blur" data-part="dialog-mask" />
        <div class="fixed inset-0 z-0 bg-black:24" data-part="dialog-mask" @click="clickMask" />
        <div class="pointer-events-none relative z-1 flex min-h-full items-center justify-center p-safe-area">
          <div
            v-bind="$attrs" ref="elDialogContent" data-part="dialog-content"
            class="pointer-events-auto relative isolate touch-pan-x touch-pan-y of-y-auto overscroll-contain rounded bg-white shadow"
          >
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<style>
.dialog-visible-enter-active,
.dialog-visible-leave-active {
  transition-duration: 0.25s;
}

.dialog-visible-enter-active [data-part='dialog-mask'],
.dialog-visible-leave-active [data-part='dialog-mask'] {
  transition: opacity 0.25s ease;
}

.dialog-visible-enter-active [data-part='dialog-content'],
.dialog-visible-leave-active [data-part='dialog-content'] {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.dialog-visible-enter-from [data-part='dialog-mask'],
.dialog-visible-leave-to [data-part='dialog-mask'] {
  opacity: 0;
}

.dialog-visible-enter-from [data-part='dialog-content'],
.dialog-visible-leave-to [data-part='dialog-content'] {
  transform: translateY(50px);
  opacity: 0;
}
</style>
