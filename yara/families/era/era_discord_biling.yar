rule ERA_Stealer_Discord_Billing_Enumeration
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer Discord billing enumeration"
        confidence = "high"

    strings:
        $billing_api = "/billing/payment-sources" ascii
        $paypal = "paypal" ascii nocase
        $card = "card" ascii nocase
        $billing_func = "getBilling" ascii

    condition:
        $billing_func and
        $billing_api and
        ($paypal or $card)
}
