# Organization workspace

Organizations is a peer of Contributions in the existing left sidebar. The same map/list header, custom pickers, restrained surfaces, independently scrolling rows and fixed-size detail card are used. There are no dot markers, numbered clusters or selection ticks.

## Catalogue research and decisions

Research checked primary documentation and official profiles on 28 October 2026. Tavily deep research required an unavailable API key; research continued through official web documentation and direct endpoint inspection.

| Source | Useful coverage | Integration and limits |
| --- | --- | --- |
| [IATI Dashboard](https://docs.unified-platform.iatistandard.org/en/latest/dashboard/) | Reporting-organization identifiers, names, websites, descriptions, types | Public current `/api/reporting-orgs/` endpoint integrated; the old CKAN route is being retired. Downloaded 2,130 publisher records in the dated snapshot. Publishers include governments, companies and funders as well as NGOs. A publisher listing does not prove current operations or impact. |
| [OCHA HDX HAPI](https://hdx-hapi.readthedocs.io/en/latest/data_usage_guides/coordination_and_context/) | Organization catalogue and country/sector/regional operational presence | Uses the existing application identifier. Complete downloaded snapshot: 2,534 organization records; 37,923 presence rows covering 20 countries, grouped to 26,069 reported operating areas before country overview aggregation. Latest source resource only; source periods can be historical. No global unique org ID is supplied. |
| [ReliefWeb sources](https://apidoc.reliefweb.int/read/resources/sources/) | Humanitarian publishers, official websites, logos, descriptions, headquarters countries | Researched. Read API requires an approved appname since November 2025. Not called using another application's name. HQ country is not operating presence. |
| [GlobalGiving](https://www.globalgiving.org/api/overview/) | Vetted partner/project profiles, themes, countries, photos and donation destinations | Researched. Requires API registration/key, and commercial usage terms must be agreed. Not represented as connected without credentials. |
| [Candid](https://developer.candid.org/reference/get-started-with-essentials) | Large US nonprofit catalogue, missions, logos, financials, compliance | Researched. Subscription key required; no invented API key or fabricated financial figures. |
| [WHO partnerships and official relations](https://www.who.int/about/collaboration/non-state-actors/non-state-actors-in-official-relations-with-who) | Specialized health partnership/reference lists | Researched as evidence, not a general worldwide NGO registry. Partnership is not proof of effectiveness or permission to accept donations. |
| [GiveWell](https://www.givewell.org/charities/top-charities) | Detailed evaluations of a small number of specific health programs | Source-linked reviews for AMF nets, Malaria Consortium seasonal prevention, Helen Keller vitamin A, and New Incentives vaccinations. Reviews are not an organization-wide score. |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) | Potential identifier/logo enrichment | Researched as a future source. Not joined by guessed name or used to infer donations, effectiveness or operating countries. |
| Official organization sites | Donation links, operating countries, mission, images and annual reports | Sixteen reviewed profiles spanning women's rights, conflict response, health, education, hunger, water, poverty and climate. Original sources are attached to every profile and operating-country claim. |

## Data rules

- Only identical source IDs merge automatically. HAPI uses the exact reported name/acronym/type tuple; similarly named organizations and affiliates remain separate. Cross-source reviewed-profile enrichment uses an explicit alias list, not fuzzy matching, acronym guessing or model-generated joins. All merged identifiers and sources are retained.
- Profile donation links are separately reviewed official destinations. Public funding agencies and unknown organizations get a disabled Donate control, never a guessed payment URL. Donations open externally and are never routed through BetterSide's sandbox contribution flow.
- Official logo URLs are used where obtained. Failed/unavailable images use a neutral letter tile; Google search thumbnails are not treated as licensed or verified organization branding.
- Country shading represents reported operations, not office coordinates, territorial coverage, effectiveness or service intensity. Global view summarizes to countries. Choosing a country exposes regional geometry where our existing OCHA boundaries match p-codes; otherwise the country remains the map anchor and the reported region names remain in details.
- Country filters use operating presence, not IATI headquarters. Women's rights uses reviewed focus and the explicit OCHA PRO-GBV sector; general protection is not relabelled as women's rights. Topic filters combine with country, organization type, search and verified donation availability.
- Size figures carry their period and source. MSF revenue is a 2025 figure; New Incentives staffing is explicitly end-2023, from a September 2024 review. We do not invent employee counts, financial size categories, success scores or effectiveness ranks for missing records.
- The dated IATI/OCHA snapshots are distinct, visible sources. They remain usable independently of live refresh failures. A live source timeout stays visible; a snapshot is never presented as a fresh successful API response. Live and snapshot entries deduplicate by source identity.

## Refresh and scope

Opening the directory and changing country use the dated snapshots immediately, without waiting for upstream services. The header Refresh action explicitly checks live sources, reusing their freshness caches. Directory queries are cached on demand: IATI/organization catalogues 24 hours, operational presence 12 hours, errors 2 minutes. Browser directory responses reuse 60-second entries. No polling, scheduled ingestion, cloud resource creation, account signup or messaging was added. Sources live under the database toolbar control.

`app/data/iatiOrganizations.json` retains the official API fields used by the adapter and its retrieval metadata. `app/data/hapiOrganizations.json` retains normalized organization and presence data plus original resource provenance. To normalize manually downloaded HAPI org/presence/resource JSON, run `pnpm dlx tsx scripts/build-organization-snapshots.ts <org.json> <presence.json> <resources.json>`. Snapshots contain public source data only; application identifiers are never written to them.

Existing issue overlays, PayPal sandbox contributions, account preferences and mutable funding balances retain their separate behavior. No deployment was performed.

## Validation

The merged snapshot serves 4,666 source-identified directory records. Local HTTP checks returned 4,336,927 bytes globally and 1,197,426 bytes for Sudan's 157 organizations. Country responses retain the selected country's regional details and each organization's other country summaries. IATI descriptions are bounded source excerpts of up to 700 characters.

Verified the organization navigation, search, country/cause/donation filters, map/list switching, official donation URLs, fixed-height detail tabs, and desktop/mobile layouts in the browser. Type checking, the production build, unit tests and cache/directory route integration checks pass. Snapshot availability and live-provider failures are tested separately. No deployment was performed.

## Organization and issue selection

The map workspace places borderless organization and issue overlays on the left and right of a full-width map. Selecting an organization shades its reported issue topics and operating areas; the separate details action opens its profile. Organization rows and profile headers use names directly without logo or initial tiles. The left list includes catalogue organizations without mapped operating areas, rather than hiding them.

Organization information now opens in a centered, fixed-size profile modal with an internally scrolling body and persistent Website/Donate footer actions. Work, operating areas and published evaluations appear directly in the profile; provenance is available through an inline Sources disclosure rather than a separate Evidence tab. No rating or financial data is inferred for organizations without reported evidence.
