import { createEffect, onCleanup, untrack } from "solid-js"
import { throttle } from "@solid-primitives/scheduled"
import { DebuggerContext, getOwner, NodeType, SolidOwner, SolidRoot } from "@shared/graph"
import { UpdateType } from "@shared/messanger"
import { batchUpdate, ComputationUpdateHandler, SignalUpdateHandler } from "./batchUpdates"
import { walkSolidTree } from "./walker"
import {
  addRootToOwnedRoots,
  createInternalRoot,
  getDebuggerContext,
  getNewSdtId,
  isSolidRoot,
  markOwnerType,
  onOwnerCleanup,
  removeDebuggerContext,
  setDebuggerContext,
} from "./utils"
import { enabled, debuggerConfig, onForceUpdate, onUpdate, updateRoot, removeRoot } from "./plugin"
import { INTERNAL } from "@shared/variables"
import { Owner } from "@shared/solid"

export function createGraphRoot(owner: SolidRoot): void {
  // setup the debugger in a separate root, so that it doesn't walk and track itself
  createInternalRoot(dispose => {
    onOwnerCleanup(owner, dispose)

    const rootId = getNewSdtId()

    const onComputationUpdate: ComputationUpdateHandler = payload => {
      if (!debuggerConfig.trackBatchedUpdates || owner.isDisposed) return
      if (enabled()) triggerRootUpdate()
      batchUpdate({ type: UpdateType.Computation, payload })
    }
    const onSignalUpdate: SignalUpdateHandler = payload => {
      if (!debuggerConfig.trackBatchedUpdates || owner.isDisposed) return
      batchUpdate({ type: UpdateType.Signal, payload })
    }

    const forceRootUpdate = () => {
      if (owner.isDisposed) return
      const { tree, components } = untrack(
        walkSolidTree.bind(void 0, owner, {
          ...debuggerConfig,
          onComputationUpdate,
          onSignalUpdate,
          rootId,
        }),
      )
      updateRoot({ id: rootId, tree, components })
    }
    const triggerRootUpdate = throttle(forceRootUpdate, 350)

    onUpdate(triggerRootUpdate)
    onForceUpdate(forceRootUpdate)

    // force trigger update when enabled changes to true
    createEffect(() => enabled() && forceRootUpdate())

    setDebuggerContext(owner, { rootId, triggerRootUpdate, forceRootUpdate })

    onCleanup(() => {
      removeDebuggerContext(owner)
      removeRoot(rootId)
      owner.isDisposed = true
    })
  })
}

/**
 * Helps the debugger find and reattach an reactive owner created by `createRoot` to it's detached parent.
 *
 * Call this synchronously inside `createRoot` callback body, whenever you are using `createRoot` yourself to dispose of computations early, or inside `<For>`/`<Index>` components to reattach their children to reactive graph visible by the devtools debugger.
 * @example
 * createRoot(dispose => {
 * 	// This reactive Owner disapears form the owner tree
 *
 * 	// Reattach the Owner to the tree:
 * 	reattachOwner();
 * });
 */
export function attachDebugger(_owner: Owner = getOwner()!): void {
  let owner = _owner as SolidOwner
  if (!owner)
    return console.warn(
      "reatachOwner helper should be used synchronously inside createRoot callback body.",
    )

  forEachLookupRoot(owner, (root, ctx) => {
    root.sdtAttached = true
    markOwnerType(root, NodeType.Root)

    if (ctx === INTERNAL) return

    // under an existing debugger root
    if (ctx) {
      ctx.triggerRootUpdate()
      let parent = findClosestAliveParent(root)!
      if (!parent.owner) return console.warn("PARENT_SHOULD_BE_ALIVE")
      let removeFromOwned = addRootToOwnedRoots(parent.owner, root)
      const onParentCleanup = () => {
        const newParent = findClosestAliveParent(root)
        if (newParent.owner) {
          parent = newParent
          removeFromOwned()
          removeFromOwned = addRootToOwnedRoots(parent.owner, root)
          onOwnerCleanup(parent.root, onParentCleanup)
        } else {
          removeFromOwned()
          removeOwnCleanup()
          createGraphRoot(root)
        }
      }
      const removeParentCleanup = onOwnerCleanup(parent.root, onParentCleanup)
      const removeOwnCleanup = onOwnerCleanup(root, () => {
        root.isDisposed = true
        removeFromOwned()
        removeParentCleanup()
        ctx.triggerRootUpdate()
      })
    }
    // seperated from existing debugger roots
    else createGraphRoot(root)
  })
}

/**
 * Searches for the closest alive parent of the given owner.
 * A parent here consists of `{ owner: SolidOwner; root: SolidRoot }` where `owner` is the closest tree node to attach to, and `root` in the closest subroot/root that is not disposed.
 * @param owner
 * @returns `{ owner: SolidOwner; root: SolidRoot }`
 */
function findClosestAliveParent(
  owner: SolidOwner,
): { owner: SolidOwner; root: SolidRoot } | { owner: null; root: null } {
  let disposed: SolidRoot | null = null
  let closestAliveRoot: SolidRoot | null = null
  let current = owner
  while (current.owner && !closestAliveRoot) {
    current = current.owner
    if (isSolidRoot(current)) {
      if (current.isDisposed) disposed = current
      else closestAliveRoot = current
    }
  }
  if (!closestAliveRoot) return { owner: null, root: null }
  return { owner: disposed?.owner ?? owner.owner!, root: closestAliveRoot }
}

/**
 * Run callback for each subroot/root from the tree root to the given owner.
 * The callback is run only for roots that haven't been handled before.
 */
function forEachLookupRoot(
  owner: SolidOwner,
  callback: (root: SolidRoot, ctx: DebuggerContext | undefined) => void,
): void {
  const roots: SolidRoot[] = []
  let ctx: DebuggerContext | undefined
  do {
    // check if it's a root/subroot
    if (isSolidRoot(owner)) {
      // skip already handled and INTERNAL roots
      if (owner.sdtAttached) {
        if (!ctx) ctx = getDebuggerContext(owner)
        break
      }
      if (owner.sdtContext === INTERNAL) {
        ctx = INTERNAL
        break
      }
      roots.push(owner as SolidRoot)
    }
    owner = owner.owner!
  } while (owner)
  // callback roots in downwards direction
  for (let i = roots.length - 1; i >= 0; i--) {
    const root = roots[i]
    callback(root, ctx)
    // check if context was added during callback
    if (root.sdtContext) ctx = root.sdtContext
  }
}
