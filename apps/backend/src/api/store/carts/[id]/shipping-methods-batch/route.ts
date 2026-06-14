import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addShippingMethodToCartWorkflow } from "@medusajs/medusa/core-flows"

// POST /store/carts/:id/shipping-methods-batch — set ALL of a cart's shipping
// methods in one call.
//
// Why this exists: the core `addShippingMethodToCartWorkflow` REMOVES every
// existing shipping method before adding the ones passed in the call (see
// add-shipping-method-to-cart.js). The built-in store route
// `POST /store/carts/:id/shipping-methods` only accepts a single `option_id`,
// so attaching methods one profile at a time wipes the previous profile's
// method — leaving a mixed cart (e.g. coffee + event ticket, which span two
// shipping profiles) with only the last profile satisfied. Cart completion then
// fails with "cart items require shipping profiles that are not satisfied by the
// current shipping methods".
//
// This route passes every option id in a single workflow run so all profiles
// are satisfied at once.
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id
  const body = (req.body ?? {}) as { option_ids?: unknown }

  const optionIds = Array.isArray(body.option_ids)
    ? Array.from(
        new Set(
          body.option_ids.filter(
            (x): x is string => typeof x === "string" && x.length > 0
          )
        )
      )
    : []

  if (!optionIds.length) {
    res.status(400).json({ message: "option_ids must be a non-empty array." })
    return
  }

  await addShippingMethodToCartWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      options: optionIds.map((id) => ({ id })),
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: ["id", "shipping_methods.shipping_option_id"],
    filters: { id: cartId },
  })

  res.status(200).json({ cart })
}
