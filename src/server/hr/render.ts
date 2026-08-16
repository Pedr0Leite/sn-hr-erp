import { GlideRecord } from '@servicenow/glide'
import { placeholdersIn } from './rules.ts'

// L6-11. Rendering, the runtime PDF probe, and the ONE function that decides what a file may be
// called. docs/l6-document-design.md §6.
//
// NEVER LABEL HTML AS PDF (OD2, story L6-5). Extension, content type, first bytes and the
// record field all come from ONE resolveFormat() return value, so there is no path on which
// they can disagree -- story L6-5 AC4 forbids a hard-coded `.pdf` or `application/pdf` anywhere
// else, and T6-18 greps for exactly that.

export interface DocumentContext {
    [placeholder: string]: string
}

export interface Format {
    extension: string
    contentType: string
    /** The value written to doc_req.output_format. */
    label: string
}

const HTML_FORMAT: Format = { extension: '.html', contentType: 'text/html', label: 'HTML' }
const PDF_FORMAT: Format = { extension: '.pdf', contentType: 'application/pdf', label: 'PDF' }

export interface Probe {
    callable: boolean
    /** Recorded verbatim on the request. OD2 is closed with instance evidence, per generation. */
    result: string
}

/**
 * §2 -- THE PROBE RUNS AT GENERATION TIME, NOT AT DEPLOY TIME.
 *
 * Installing the PDF store app later therefore needs no redeploy of this app: the next
 * generation probes, finds the API and produces a PDF. Plugin state is NOT the question --
 * `com.snc.apppdfgenerator` and `com.snc.whtp` are both active on this instance and neither
 * supplies a scoped API. CALLABILITY is the question, so the record lookup is followed by a
 * guarded typeof on the class itself.
 */
export function probePdf(): Probe {
    const gr = new GlideRecord('sys_script_include')
    gr.addQuery('name', 'PDFGenerationAPI')
    gr.query()
    if (!gr.next()) {
        return { callable: false, result: 'PDFGenerationAPI absent from sys_script_include' }
    }
    // NOTE, AND IT IS A REAL LIMITATION: the design's second half of this probe -- a guarded
    // `typeof` on the class itself -- cannot be written here. The platform's TypeScript build
    // rejects `global` / `globalThis` in a scoped module (`no-unsupported-node-builtins`), and
    // the symbol is not declared, so there is nothing to test. The probe therefore reports
    // PRESENCE, and CALLABILITY is asserted where it actually matters: resolveFormat() refuses
    // to label anything PDF unless the converter returned real `%PDF-` bytes. A present but
    // uncallable API therefore yields HTML, correctly labelled, not a crash and not a lie.
    return { callable: true, result: 'PDFGenerationAPI present in sys_script_include' }
}

/**
 * THE ONE PLACE A FORMAT IS DECIDED. `bytes` is the first few characters of what the converter
 * actually returned.
 *
 * L6-D6 -- THE `%PDF-` BYTE CHECK IS MANDATORY, NOT BELT-AND-BRACES. The realistic failure is a
 * converter returning an HTML error page with HTTP 200: it passes the extension check, the
 * content-type check and the record-field check, and fails only on the bytes.
 */
export function resolveFormat(probe: Probe, bytes: string | null): Format {
    if (!probe.callable) {
        return HTML_FORMAT
    }
    if (!bytes || bytes.substring(0, 5) !== '%PDF-') {
        return HTML_FORMAT
    }
    return PDF_FORMAT
}

/** Every substituted value is escaped. A salary is a figure, not markup. */
function escapeHtml(raw: string): string {
    return String(raw)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export interface RenderResult {
    html: string | null
    /** Empty on success. Names the placeholder, never its value. */
    error: string
}

/**
 * §6. Substitute `${placeholder}` from the context.
 *
 * EVERY PLACEHOLDER MUST RESOLVE. An unresolved one is an internal error -> status failed, NO
 * attachment. Step 4's pre-flight means it cannot happen; the check exists because "cannot
 * happen" is how a blank lands on a mortgage application.
 */
export function renderHtml(context: DocumentContext, body: string): RenderResult {
    const used = placeholdersIn(body)
    for (let i = 0; i < used.length; i++) {
        const value = context[used[i]]
        if (value === undefined || value === null || value === '') {
            return { html: null, error: "'" + used[i] + "' did not resolve at render time" }
        }
    }
    let out = body
    for (let i = 0; i < used.length; i++) {
        out = out.split('${' + used[i] + '}').join(escapeHtml(context[used[i]]))
    }
    return { html: out, error: '' }
}
