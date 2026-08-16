import { BusinessRule } from '@servicenow/sdk/core'
import { validateErpSystem } from '../../server/business-rules/validate-erp-system'
import { validateFieldMap, validateObjectMap } from '../../server/business-rules/validate-mappings'
import { annotateObjectMap } from '../../server/business-rules/annotate-object-map'

// L1-5 and L1-8. Bodies are MODULE FUNCTIONS, not Now.include() strings: business-rule-guide
// instruction 3 and module-guide both mandate it, D15 proved the SDK's require() bridge
// builds, and the string form would drop type checking on the only validation logic in L1.

// L1-5 / §3.3 / story L1-2. before insert + update.
BusinessRule({
    $id: Now.ID['br-erp-system-validate'],
    name: 'Validate ERP system configuration',
    table: 'x_335329_sn_hr_erp_erp_system',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        'Refuses internally contradictory connection configurations at save time. Validates contradictions ONLY -- it makes no outbound call and never checks reachability (story L1-2 AC6): a fixture pointing at an unreachable host must save so that L2 and L3 can prove their failed states.',
    script: validateErpSystem,
})

// L1-6 support / story L1-3 AC3. Produces the readable duplicate message ahead of the
// unique index, which refuses correctly but cannot name the pair.
BusinessRule({
    $id: Now.ID['br-object-map-unique'],
    name: 'Object mapping uniqueness message',
    table: 'x_335329_sn_hr_erp_object_map',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        'Names both the ERP system and the logical object when a duplicate object mapping is refused. The unique index idx_object_map_system_object remains the real constraint.',
    script: validateObjectMap,
})

// L1-8 / story L1-3 AC6 / T1-12. The Table API does not evaluate a choice list, so the
// choice list alone cannot satisfy this criterion.
BusinessRule({
    $id: Now.ID['br-field-map-validate'],
    name: 'Validate field mapping against the logical contract',
    table: 'x_335329_sn_hr_erp_field_map',
    when: 'before',
    action: ['insert', 'update'],
    order: 100,
    active: true,
    description:
        "Rejects a logical_field that is not in the parent object's contract with the message \"Unknown logical field '<name>' for object '<object>'.\", and denormalises the parent's logical_object onto the child row.",
    script: validateFieldMap,
})

// L1-13 / §5.4 / §5.5. The two form annotations, derived at render time and never cached --
// so clearing the verified flag restores the banner with nothing to invalidate (story L1-4 AC8).
BusinessRule({
    $id: Now.ID['br-object-map-annotate'],
    name: 'Object mapping form annotations',
    table: 'x_335329_sn_hr_erp_object_map',
    when: 'display',
    order: 100,
    active: true,
    description:
        'Renders the unverified-default-mapping warning (§5.4) and the no-field-mapping warning (§5.5) on the object mapping form. Derived at render time; nothing is cached.',
    script: annotateObjectMap,
})
