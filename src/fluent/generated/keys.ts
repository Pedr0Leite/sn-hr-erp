import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'acl-call-log-create': {
                        table: 'sys_security_acl'
                        id: 'b1d4277d5b424115b24710a01f70b213'
                    }
                    'acl-call-log-delete': {
                        table: 'sys_security_acl'
                        id: '2b9282c44c834bdfad0a2f114feadfd4'
                    }
                    'acl-call-log-read': {
                        table: 'sys_security_acl'
                        id: 'a0aba4e1ed454b45b201a14108100582'
                    }
                    'acl-doc-req-create': {
                        table: 'sys_security_acl'
                        id: '52a18ca1feb64e5aad25e08011a21b0e'
                    }
                    'acl-doc-req-read': {
                        table: 'sys_security_acl'
                        id: '90ac9c7e2771442fb521f76f374d2dcc'
                    }
                    'acl-doc-req-write-failure-reason': {
                        table: 'sys_security_acl'
                        id: 'ed080591ce49480b9d7c72f4df5f409d'
                    }
                    'acl-doc-req-write-generated-on': {
                        table: 'sys_security_acl'
                        id: 'fcc6e3fc98374daeb219d9484c629adc'
                    }
                    'acl-doc-req-write-output-format': {
                        table: 'sys_security_acl'
                        id: 'ea3468bd57914a2d891de9d7717d0629'
                    }
                    'acl-doc-req-write-pdf-probe': {
                        table: 'sys_security_acl'
                        id: 'eb03b394dd834f3daa928d5ef3e1dbdb'
                    }
                    'acl-doc-req-write-requester': {
                        table: 'sys_security_acl'
                        id: '7fa4d164995e4e659e2458a5b7dfe2ff'
                    }
                    'acl-doc-req-write-source-call-ids': {
                        table: 'sys_security_acl'
                        id: '3e9984eae12a418291d792b04d7468a9'
                    }
                    'acl-doc-req-write-status': {
                        table: 'sys_security_acl'
                        id: 'e055e746e7ac48ffaad6034cec5b3d60'
                    }
                    'acl-doc-tmpl-create': {
                        table: 'sys_security_acl'
                        id: '6a1021647a0247bf9aa1ecc51cb224d2'
                    }
                    'acl-doc-tmpl-read': {
                        table: 'sys_security_acl'
                        id: '98423b6b1973492e8f9fc8659a27a6f8'
                    }
                    'acl-doc-tmpl-write': {
                        table: 'sys_security_acl'
                        id: '5d65bee8864a48e3bc42eea00f0b9dad'
                    }
                    'acl-doc-type-create': {
                        table: 'sys_security_acl'
                        id: '402f66d7e8014edcb129a1675ca2ba2e'
                    }
                    'acl-doc-type-read': {
                        table: 'sys_security_acl'
                        id: '3a06a3f1ea914c79bc4c4b58d67ca60a'
                    }
                    'acl-doc-type-write': {
                        table: 'sys_security_acl'
                        id: 'bf72af756e0b408d95e2db5ed429c2c2'
                    }
                    'acl-emp-xref-create': {
                        table: 'sys_security_acl'
                        id: 'fbf74a8a628c4a4a8bacb8bb521c9afb'
                    }
                    'acl-emp-xref-delete': {
                        table: 'sys_security_acl'
                        id: 'ace0134fb0b24c74b57faa6bad569f51'
                    }
                    'acl-emp-xref-read': {
                        table: 'sys_security_acl'
                        id: 'a2acf949a6674128ab15f28b25c891a6'
                    }
                    'acl-emp-xref-write': {
                        table: 'sys_security_acl'
                        id: 'f4cf447c69824207ba4437437af80647'
                    }
                    'acl-erp-exception-deny-category': {
                        table: 'sys_security_acl'
                        id: 'a5b2d21ec26242fb83470c5ac675f4de'
                    }
                    'acl-erp-exception-read': {
                        table: 'sys_security_acl'
                        id: '00f5ae61c4534cb0bb4e279b7c11054b'
                    }
                    'acl-erp-exception-write': {
                        table: 'sys_security_acl'
                        id: '09dc9a297ca7448cb5333678c53c1817'
                    }
                    'acl-erp-system-create': {
                        table: 'sys_security_acl'
                        id: 'ee1e120a2888421fb6b81fb370dd1b82'
                    }
                    'acl-erp-system-delete': {
                        table: 'sys_security_acl'
                        id: '63ba6abfd7fe4a82851a1ba4e51492ab'
                    }
                    'acl-erp-system-read': {
                        table: 'sys_security_acl'
                        id: '7390d857682246f0a454a5ee5ffe8c5c'
                    }
                    'acl-erp-system-read-auth-basic': {
                        table: 'sys_security_acl'
                        id: 'c663c7b32998402297187f4b58cf2ac9'
                    }
                    'acl-erp-system-read-auth-mutual': {
                        table: 'sys_security_acl'
                        id: '9ee1ff7b1c244ac689e345593bce2e0e'
                    }
                    'acl-erp-system-read-auth-oauth': {
                        table: 'sys_security_acl'
                        id: '4a6e7e025a4c493b99ae09afc15e69ad'
                    }
                    'acl-erp-system-read-base-url': {
                        table: 'sys_security_acl'
                        id: 'f5984c87ba41480787163503cdf33bfb'
                    }
                    'acl-erp-system-read-mid-server': {
                        table: 'sys_security_acl'
                        id: '196e338b42cd4399825aa42947f93f01'
                    }
                    'acl-erp-system-write': {
                        table: 'sys_security_acl'
                        id: '6666d9e632d34a8f89edf4ad41a91354'
                    }
                    'acl-erp-write-deny-ack': {
                        table: 'sys_security_acl'
                        id: 'cf2e09283e624212ad69b7497d2f648b'
                    }
                    'acl-erp-write-deny-approval': {
                        table: 'sys_security_acl'
                        id: 'd64062ce2ebd40fca6638d09c9445ab7'
                    }
                    'acl-erp-write-deny-first-sent': {
                        table: 'sys_security_acl'
                        id: 'd9b13b324775481bab7adb1c65c744d4'
                    }
                    'acl-erp-write-deny-idem': {
                        table: 'sys_security_acl'
                        id: 'e135de255af748bcbc8778a0973accfa'
                    }
                    'acl-erp-write-deny-state': {
                        table: 'sys_security_acl'
                        id: '21ef5b3f5fef425aae24768021f5a17f'
                    }
                    'acl-erp-write-read': {
                        table: 'sys_security_acl'
                        id: 'b3d719e965744394a2571dc55768fdb0'
                    }
                    'acl-field-map-create': {
                        table: 'sys_security_acl'
                        id: '3be9e11456e048b8ac7827a82988a861'
                    }
                    'acl-field-map-delete': {
                        table: 'sys_security_acl'
                        id: '8e1e1d33b56c4a38a4382301644886bd'
                    }
                    'acl-field-map-read': {
                        table: 'sys_security_acl'
                        id: '5b8843f9bbd14170936a3580f6ca4810'
                    }
                    'acl-field-map-write': {
                        table: 'sys_security_acl'
                        id: '8113e33f01ad4bc0ba7652f59bc48fe7'
                    }
                    'acl-landscape-create': {
                        table: 'sys_security_acl'
                        id: 'd2e804c5b9754869b6ef0627def6b8ed'
                    }
                    'acl-landscape-read': {
                        table: 'sys_security_acl'
                        id: '6d91874773fb4e5c9661b69f7a4f36a8'
                    }
                    'acl-landscape-write': {
                        table: 'sys_security_acl'
                        id: '0d91b8680604417eb9e173840e4c8d13'
                    }
                    'acl-map-tmpl-create': {
                        table: 'sys_security_acl'
                        id: '7189dc044afa49eea57cfe32dccadcfd'
                    }
                    'acl-map-tmpl-delete': {
                        table: 'sys_security_acl'
                        id: '176ba1924d1348a0b3cfb85a3a6f49a5'
                    }
                    'acl-map-tmpl-read': {
                        table: 'sys_security_acl'
                        id: '64d43749138a4bafbc1820bccbe4c02c'
                    }
                    'acl-map-tmpl-write': {
                        table: 'sys_security_acl'
                        id: '0776c025bd854d0d8822b496f17e9271'
                    }
                    'acl-object-map-create': {
                        table: 'sys_security_acl'
                        id: 'a0b5bb94bb474b22a0c14f01f9e9b20c'
                    }
                    'acl-object-map-delete': {
                        table: 'sys_security_acl'
                        id: '9584fc1050c64898bee1c5272beef317'
                    }
                    'acl-object-map-read': {
                        table: 'sys_security_acl'
                        id: 'fe41a4344b644a89bc34eb665cdab74f'
                    }
                    'acl-object-map-read-query-template': {
                        table: 'sys_security_acl'
                        id: '2386bee64a384f82ac1f363c0f9a115b'
                    }
                    'acl-object-map-write': {
                        table: 'sys_security_acl'
                        id: 'ef6a0a9428214fac9ec74b1c3ab5a4cf'
                    }
                    'acl-object-map-write-mapping-source': {
                        table: 'sys_security_acl'
                        id: '1b74adf584a649e4a2f739d40b96c213'
                    }
                    'acl-object-map-write-mapping-verified': {
                        table: 'sys_security_acl'
                        id: '19f3e553e6dd4c6482bb4ec42c796593'
                    }
                    'acl-payroll-calendar-create': {
                        table: 'sys_security_acl'
                        id: '50c2b021e8874387a8af77ebac64af72'
                    }
                    'acl-payroll-calendar-read': {
                        table: 'sys_security_acl'
                        id: '87df98c108a34fd69f839e1609a61752'
                    }
                    'acl-payroll-calendar-write': {
                        table: 'sys_security_acl'
                        id: 'b0f8628851744cd397b33177dfe371f9'
                    }
                    'acl-probe-protected-write-shape-a': {
                        table: 'sys_security_acl'
                        id: '75864fd439204b70b29e6d4d9c625793'
                        deleted: true
                    }
                    'acl-scope-grant-create': {
                        table: 'sys_security_acl'
                        id: '632b902b39c74e78bd06ef522c3df5f8'
                    }
                    'acl-scope-grant-read': {
                        table: 'sys_security_acl'
                        id: '03bc0a60753245bab7ec955cd629ca4d'
                    }
                    'acl-scope-grant-write': {
                        table: 'sys_security_acl'
                        id: '688db67b5f3643e0a1596ee3680ad70a'
                    }
                    'acl-staging-delete': {
                        table: 'sys_security_acl'
                        id: '9e52a450098e469a8f1e79a721765410'
                    }
                    'acl-staging-read': {
                        table: 'sys_security_acl'
                        id: 'a788952a37c6490099b0e959f1c839bf'
                    }
                    'acl-staging-write-amount': {
                        table: 'sys_security_acl'
                        id: '60b5fd836a014e88a08e30823c84bf97'
                    }
                    'acl-staging-write-code': {
                        table: 'sys_security_acl'
                        id: '44ac054af98e4af0b22839e179dc09d4'
                    }
                    'acl-staging-write-delta': {
                        table: 'sys_security_acl'
                        id: '749f2c50cfd745a7a3de59155557d11d'
                    }
                    'acl-staging-write-dim': {
                        table: 'sys_security_acl'
                        id: '44c06b35b7e244e2802431a10cd82e69'
                    }
                    'acl-staging-write-erp-category': {
                        table: 'sys_security_acl'
                        id: '5e6274d869ff4813a3abf06e811e1a11'
                    }
                    'acl-staging-write-erp-system': {
                        table: 'sys_security_acl'
                        id: 'd0d11344c571421895866309be9213d8'
                    }
                    'acl-staging-write-fetched-at': {
                        table: 'sys_security_acl'
                        id: 'fa1bc8ab4658437299a4c11ad2442bb7'
                    }
                    'acl-staging-write-label': {
                        table: 'sys_security_acl'
                        id: 'cfd9cdfe497d4b19a6d1897734bb0e5a'
                    }
                    'acl-staging-write-logical-object': {
                        table: 'sys_security_acl'
                        id: 'e7a4754b8568480ab847f1276f351dae'
                    }
                    'acl-staging-write-object-map': {
                        table: 'sys_security_acl'
                        id: 'd3843c30ab754eba9708ed75593f44c7'
                    }
                    'acl-staging-write-occurred-on': {
                        table: 'sys_security_acl'
                        id: 'dece4eb985724f018f295fb4fbd73c1f'
                    }
                    'acl-staging-write-payload': {
                        table: 'sys_security_acl'
                        id: '71a14ef7ba4d4c259356d1e2411b41fd'
                    }
                    'acl-staging-write-qty': {
                        table: 'sys_security_acl'
                        id: 'cbd69afee4b04d93a34475dfaf5ba923'
                    }
                    'acl-staging-write-ratio': {
                        table: 'sys_security_acl'
                        id: '88ab88dd2439426480c3827082853936'
                    }
                    'acl-staging-write-source-record-id': {
                        table: 'sys_security_acl'
                        id: 'de1d3d3ea7dc482b9388fe6f6915d848'
                    }
                    'acl-staging-write-status': {
                        table: 'sys_security_acl'
                        id: 'b5f5f29b04474173a4b5e01f68a17de2'
                    }
                    'acl-staging-write-sync-run': {
                        table: 'sys_security_acl'
                        id: 'c049fdd4dd1d4106bc6862cbc131f312'
                    }
                    'acl-staging-write-threshold': {
                        table: 'sys_security_acl'
                        id: 'f4b0bdf28e6f4b3f984cfaac90a62b1d'
                    }
                    'acl-sync-request-create': {
                        table: 'sys_security_acl'
                        id: '44108c6d743e4949a4c4171651b19f54'
                    }
                    'acl-sync-request-delete': {
                        table: 'sys_security_acl'
                        id: 'b99a37a96b7444d7b709c1e7ede3c029'
                    }
                    'acl-sync-request-read': {
                        table: 'sys_security_acl'
                        id: 'f344462c8bb34dc29ccd3d94d36a063b'
                    }
                    'acl-sync-request-write': {
                        table: 'sys_security_acl'
                        id: 'ac617506ca814fbf86577e5e9369516a'
                    }
                    'acl-sync-run-delete': {
                        table: 'sys_security_acl'
                        id: '40472c38b67d4d83820e7373236b0905'
                    }
                    'acl-sync-run-read': {
                        table: 'sys_security_acl'
                        id: '8490f3800b934818aed5cade7b8d246c'
                    }
                    'acl-sync-run-read-error-message': {
                        table: 'sys_security_acl'
                        id: '7e0f6a3760f7468c81d8a58d66056e7c'
                    }
                    'acl-sync-run-write-rows-fetched': {
                        table: 'sys_security_acl'
                        id: 'bce80478310547e9b13e7396ab1d1723'
                    }
                    'acl-sync-run-write-status': {
                        table: 'sys_security_acl'
                        id: '723d8a5d07c14061a498aff6511f45eb'
                    }
                    'acl-usage-event-read': {
                        table: 'sys_security_acl'
                        id: 'f7cf7692e3064fbbbe0c2f3eea56a19e'
                    }
                    'acl-usage-event-write': {
                        table: 'sys_security_acl'
                        id: '5aa0c6aba8cf40bb87a67b964e1dbae2'
                    }
                    'acl-vendor-onboarding-create': {
                        table: 'sys_security_acl'
                        id: '3a522ef8f4bd4e6fa4aeefbf7e860983'
                    }
                    'acl-vendor-onboarding-read': {
                        table: 'sys_security_acl'
                        id: 'df348789220b4bd3b22aad5a6013b35d'
                    }
                    'acl-vendor-onboarding-write': {
                        table: 'sys_security_acl'
                        id: '7298e6efdce2443db8f6013b417cfa90'
                    }
                    'acl-write-policy-deny-required': {
                        table: 'sys_security_acl'
                        id: 'd0bd9a670ae74adba91729cea78e47ff'
                    }
                    'acl-write-policy-read': {
                        table: 'sys_security_acl'
                        id: '38fce3e922b8405ab8a9af9d588f384a'
                    }
                    'acl-write-policy-write': {
                        table: 'sys_security_acl'
                        id: '73e94abeadc34b319a261215a42f6bbd'
                    }
                    'app-menu-sn-hr-erp': {
                        table: 'sys_app_application'
                        id: 'd94b6401d6f247998f474fee15a3b8ac'
                    }
                    'app.css': {
                        table: 'sys_ux_theme_asset'
                        id: '51578a012af64acebf8d92822c6399e4'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'ba6f48024ee545a290dfeba333a9c5c7'
                    }
                    'br-doc-request-boundary': {
                        table: 'sys_script'
                        id: '2a2d2cc207fe4cceacf618de863952fb'
                    }
                    'br-doc-template-placeholders': {
                        table: 'sys_script'
                        id: 'ad9f14cb6e5e43b796b32d8ae07e9685'
                    }
                    'br-doc-type-activation': {
                        table: 'sys_script'
                        id: 'ce889ba8753549daa15358ad0f2d9670'
                    }
                    'br-erp-system-validate': {
                        table: 'sys_script'
                        id: 'd9d9de2146b248149b416f7b855ed193'
                    }
                    'br-field-map-validate': {
                        table: 'sys_script'
                        id: '84e9b779fb914b7e9573da838d7cf895'
                    }
                    'br-object-map-annotate': {
                        table: 'sys_script'
                        id: '5a8291cd338946d2b911569aef57ab5c'
                    }
                    'br-object-map-unique': {
                        table: 'sys_script'
                        id: '4ec8656cdb3248dfa40c08c46237b2ed'
                    }
                    'br-staging-validate': {
                        table: 'sys_script'
                        id: 'd751c28b3f0e4c198631c9025e304458'
                    }
                    'br-sync-run-validate': {
                        table: 'sys_script'
                        id: '45395255b9e14c93800d46e0e7e70ce2'
                    }
                    ErpConnector: {
                        table: 'sys_script_include'
                        id: '853e7575ed0b4da3b871510b7c586666'
                    }
                    'hub-api': {
                        table: 'sys_ws_definition'
                        id: '8bec3ab7c197442c95afdcadcab7dd8d'
                    }
                    'hub-route-data': {
                        table: 'sys_ws_operation'
                        id: '29dca62e37384a68b9e4af4eaf3c73db'
                    }
                    'hub-route-data-param-tab': {
                        table: 'sys_ws_query_parameter'
                        id: '0f7d84c1c308400882ad2a891adbff3d'
                    }
                    'hub-route-me': {
                        table: 'sys_ws_operation'
                        id: 'c462d8ba57344a10a3a7cb21e1f4729e'
                    }
                    'hub-route-refresh': {
                        table: 'sys_ws_operation'
                        id: '35fa6f1d2359428c85137d451c09f0e3'
                    }
                    'hub-workspace': {
                        table: 'sys_ux_page_registry'
                        id: '3b5de4da84f74605be589210dd9aac9c'
                    }
                    'hub-workspace_sys_ux_app_config_workspace': {
                        table: 'sys_ux_app_config'
                        id: '23c98a3962534819890b34d3479ffd55'
                    }
                    'hub-workspace_sys_ux_app_route_home': {
                        table: 'sys_ux_app_route'
                        id: 'd1c3bd9c73794853bdab566dc8baf907'
                    }
                    'hub-workspace_sys_ux_app_route_list': {
                        table: 'sys_ux_app_route'
                        id: '12b8cacab8d340c795c401c576b6ed73'
                    }
                    'hub-workspace_sys_ux_app_route_record': {
                        table: 'sys_ux_app_route'
                        id: 'b5557b9488344fdba13fa31c69827fce'
                    }
                    'hub-workspace_sys_ux_app_route_simple-list': {
                        table: 'sys_ux_app_route'
                        id: '2252ef5d867d4892ad788228a6a9c604'
                    }
                    'hub-workspace_sys_ux_macroponent_record': {
                        table: 'sys_ux_macroponent'
                        id: '76b2e8c2696b40c0b1b0a1729edd42f7'
                    }
                    'hub-workspace_sys_ux_page_property_chrome_footer': {
                        table: 'sys_ux_page_property'
                        id: '4f21037d22aa474086aba5d4a8a5b645'
                    }
                    'hub-workspace_sys_ux_page_property_chrome_header': {
                        table: 'sys_ux_page_property'
                        id: '80e3c55f5b7a400daa27cf59e72b35b6'
                    }
                    'hub-workspace_sys_ux_page_property_chrome_tab': {
                        table: 'sys_ux_page_property'
                        id: 'eff51c2d9bf246dfa6b9d1d5961fc207'
                    }
                    'hub-workspace_sys_ux_page_property_chrome_toolbar': {
                        table: 'sys_ux_page_property'
                        id: '190dedc94c6545d0aa3b19c3b55279b7'
                    }
                    'hub-workspace_sys_ux_page_property_listConfigId': {
                        table: 'sys_ux_page_property'
                        id: '1d333c1daefa44098f52339935e7d1d1'
                    }
                    'hub-workspace_sys_ux_page_property_view': {
                        table: 'sys_ux_page_property'
                        id: '85aaed2a30784d048e02698c2ec3cfb4'
                    }
                    'hub-workspace_sys_ux_page_property_wbApplicabilityConfigId': {
                        table: 'sys_ux_page_property'
                        id: 'de56ce2b20c34071a6adde355e2d75e4'
                    }
                    'hub-workspace_sys_ux_registry_m2m_category_unifiedNav': {
                        table: 'sys_ux_registry_m2m_category'
                        id: '7f21629e34634701aa67c2aa105ebbe9'
                    }
                    'hub-workspace_sys_ux_screen_home': {
                        table: 'sys_ux_screen'
                        id: '36c7aba3be4e4b7db5d22dd5b9975d34'
                    }
                    'hub-workspace_sys_ux_screen_list': {
                        table: 'sys_ux_screen'
                        id: 'ad126e600ca54826b55638008257024f'
                    }
                    'hub-workspace_sys_ux_screen_record': {
                        table: 'sys_ux_screen'
                        id: 'edb8af8d14044d69b391427c9342bdde'
                    }
                    'hub-workspace_sys_ux_screen_simple-list': {
                        table: 'sys_ux_screen'
                        id: 'c89e7801861745edaee91d96cae01c30'
                    }
                    'hub-workspace_sys_ux_screen_type_home': {
                        table: 'sys_ux_screen_type'
                        id: 'c9737626dc6040ff8ead22ffd2d3d0c2'
                    }
                    'hub-workspace_sys_ux_screen_type_list': {
                        table: 'sys_ux_screen_type'
                        id: '88c53eb0dc504dc78225cdb2a79b7e68'
                    }
                    'hub-workspace_sys_ux_screen_type_record': {
                        table: 'sys_ux_screen_type'
                        id: 'af493992308e4e929ddc03d2610f9b9c'
                    }
                    'hub-workspace_sys_ux_screen_type_simple-list': {
                        table: 'sys_ux_screen_type'
                        id: 'd1f7a77f546f49f79a00f09951d9ac0c'
                    }
                    'l2-auth-profile-basic': {
                        table: 'sys_auth_profile_basic'
                        id: '9804b9192b10496bba01da6c381da73e'
                    }
                    'l2-cleanup': {
                        table: 'sysauto_script'
                        id: 'cbfc684bcb7a450da8424c208dd701fb'
                    }
                    'l2-driver-admin': {
                        table: 'sysauto_script'
                        id: '7f94b1844de2493bb5bbd19eced38aa0'
                    }
                    'l2-driver-gate': {
                        table: 'sysauto_script'
                        id: '10fe36d40cb24526ab805c2200ab6cca'
                    }
                    'l2-driver-viewer': {
                        table: 'sysauto_script'
                        id: '88f0d9f8f9f44a3285ebc95ac498b768'
                    }
                    'l2-field-a-balance-amount': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '5901b1bae33e4cb8a7ddd857776fd66e'
                    }
                    'l2-field-a-fixed-asset-value': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: 'fc0f12e8ee08457091fa108cf9f0ed70'
                    }
                    'l2-field-a-gl-summary-revenue': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: 'f261a7777c9f4394bf92837d2f1e5b1b'
                    }
                    'l2-field-a-invoice-amount': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '259e3245c99647d7941af2b36b60614f'
                    }
                    'l2-field-a-invoice-currency': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '2e708468a3924d69bda69bbaff0886fa'
                    }
                    'l2-field-a-invoice-due-on': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '429887f0fd684cafa1db4f36ab0dd94a'
                    }
                    'l2-field-a-invoice-number': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '4530496f5db64b619c506b89848d9e40'
                    }
                    'l2-field-a-maintenance-tag': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: 'c687e14fbb4145cd8342c34c2a6f0661'
                    }
                    'l2-field-a-purchase-order-amount': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: 'e5c46e8dd39943fb876a1ac2c637bb88'
                    }
                    'l2-field-a-requisition-number': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '637176820ea948cc8773f488ea446950'
                    }
                    'l2-field-a-vendor-invoice-amount': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '5cc973af26a54f6487dcbc22c870517a'
                    }
                    'l2-field-a-work-order-number': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '2aaeb932ae2046dbab6e87bdee43e2c7'
                    }
                    'l2-field-b-invoice-amount': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: '8bd982db6fbb472b8f35e4c002fa4eef'
                    }
                    'l2-field-b-invoice-number': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: 'c77060f10eeb4686a3a1c216e759fc44'
                    }
                    'l2-field-c-invoice-number': {
                        table: 'x_335329_sn_hr_erp_field_map'
                        id: 'f696a59b6e964557a4200c14738559e6'
                    }
                    'l2-harness': {
                        table: 'sysauto_script'
                        id: 'c991a186a3d24e1380b04c6b9f37451a'
                    }
                    'l2-map-a-balance': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: '4db4785b310c47488fcf1c4b51bf7246'
                    }
                    'l2-map-a-fixed-asset': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: 'c100aaf41a4e4415a3010fdf45cc2b3e'
                    }
                    'l2-map-a-gl-summary': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: '3cb1661093944ef184a210611045aa68'
                    }
                    'l2-map-a-invoice': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: 'e11536f489944acb854fe4fcbe316a01'
                    }
                    'l2-map-a-maintenance': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: 'c6b629ab4f27495991a0142382605b35'
                    }
                    'l2-map-a-purchase-order': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: '20461ced15814717a3184f7cc28346f6'
                    }
                    'l2-map-a-requisition': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: '5720fea3d0064d1a9c6184103aec4bf4'
                    }
                    'l2-map-a-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: 'f3c30fe65945491392b8f234a3713121'
                    }
                    'l2-map-a-work-order': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: 'd7a21e53527346abaac2bbddd00aa56d'
                    }
                    'l2-map-b-invoice': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: '7df4abe800074bb1abe96da597b396fd'
                    }
                    'l2-map-c-invoice': {
                        table: 'x_335329_sn_hr_erp_object_map'
                        id: 'a2ef21f8dc6b489687f5044b23d1ae3c'
                    }
                    'l2-prop-harness-external-id': {
                        table: 'sys_properties'
                        id: 'f527b3c36433456383f0d59e0a07b32d'
                    }
                    'l2-prop-harness-object': {
                        table: 'sys_properties'
                        id: '0850ef83d9e946fbab67afb07d7091b0'
                    }
                    'l2-prop-harness-system': {
                        table: 'sys_properties'
                        id: '41ffed7d778a4ab5879626b088ca86ab'
                    }
                    'l2-prop-test-system-a': {
                        table: 'sys_properties'
                        id: '57e3e44281584dbebbb04b4a87388bac'
                    }
                    'l2-prop-test-system-b': {
                        table: 'sys_properties'
                        id: 'a74f51d85d0240448bfb2df171f0d96a'
                    }
                    'l2-prop-test-system-c': {
                        table: 'sys_properties'
                        id: 'd932d82d3c614e9dbd4e2ec4e9c97636'
                    }
                    'l3-driver-gate': {
                        table: 'sysauto_script'
                        id: '1f9a36b2a90140b7b383a3665b37876a'
                    }
                    'l3-prop-gate-object': {
                        table: 'sys_properties'
                        id: '85da3b950dbb43b498fb4a9e7d3f429f'
                    }
                    'l3-prop-gate-object-unmapped': {
                        table: 'sys_properties'
                        id: 'bdfc2871a1cd4b86ac4999b29beb0cd1'
                    }
                    'l3-refresh-drainer': {
                        table: 'sysauto_script'
                        id: 'e1c086ef23e341fc90fadc7d173541fa'
                    }
                    'l3-retention-cleaner': {
                        table: 'sysauto_script'
                        id: '8391f530cd974cc69299188e496c6267'
                    }
                    'l3-scheduled-sync': {
                        table: 'sysauto_script'
                        id: '45eb0eecd4e34de8952c6a02ba2028f0'
                    }
                    'l6-doc-request-producer': {
                        table: 'sc_cat_item_producer'
                        id: '84ed5f41094747f58577f2e76d1d9bf1'
                    }
                    'l6-doc-tmpl-employment-verification': {
                        table: 'x_335329_sn_hr_erp_doc_tmpl'
                        id: '3a21ee2bdb534213ae5d6b7709c95e59'
                    }
                    'l6-doc-tmpl-salary-certificate': {
                        table: 'x_335329_sn_hr_erp_doc_tmpl'
                        id: '4fb7bde9f4034465b675a30e6b223654'
                    }
                    'l6-doc-type-employment-verification': {
                        table: 'x_335329_sn_hr_erp_doc_type'
                        id: 'f0869001799943f5a6de399781842ad0'
                    }
                    'l6-doc-type-salary-certificate': {
                        table: 'x_335329_sn_hr_erp_doc_type'
                        id: '7ab013cefb43452f987743e77612cd7d'
                    }
                    'l6-document-drainer': {
                        table: 'sysauto_script'
                        id: 'c0c991099090411c8976209606ee9e89'
                    }
                    'module-doc-requests': {
                        table: 'sys_app_module'
                        id: '70c573cd2a564011ac5d090151517f69'
                    }
                    'module-doc-templates': {
                        table: 'sys_app_module'
                        id: 'b0413278c5b9427a9af75113b0d06b0a'
                    }
                    'module-doc-types': {
                        table: 'sys_app_module'
                        id: '9c3f689721be4356a54a2f3083953403'
                    }
                    'module-emp-xref': {
                        table: 'sys_app_module'
                        id: '9d39b5bf33da481f84441d91969040e4'
                    }
                    'module-erp-systems': {
                        table: 'sys_app_module'
                        id: 'e4d45f8638184db0a56d554d2b37c05c'
                    }
                    'module-hub-page': {
                        table: 'sys_app_module'
                        id: '27e5b27848924482ba34f793ecd1ebd3'
                    }
                    'module-mapping-templates': {
                        table: 'sys_app_module'
                        id: 'bc5254f6d5a049ed9e848dc6a2dd88cc'
                    }
                    'module-object-maps': {
                        table: 'sys_app_module'
                        id: '419287a529a44cce87d435ffb7abdf07'
                    }
                    'module-unverified-mappings': {
                        table: 'sys_app_module'
                        id: '3f5e4c9cfd2d4cd28a56e6b040cd2007'
                    }
                    'nv-doc-tmpl-annual-tax-statement': {
                        table: 'x_335329_sn_hr_erp_doc_tmpl'
                        id: '727c3a4500f84c5c93c2ab28b2c3bc77'
                    }
                    'nv-doc-tmpl-leave-balance-certificate': {
                        table: 'x_335329_sn_hr_erp_doc_tmpl'
                        id: '6d4e5d1eca3a42d582e6b370bdcf4fce'
                    }
                    'nv-doc-tmpl-pension-statement': {
                        table: 'x_335329_sn_hr_erp_doc_tmpl'
                        id: '37bcf543ec1649769724ea244ea7a888'
                    }
                    'nv-doc-tmpl-visa-support-letter': {
                        table: 'x_335329_sn_hr_erp_doc_tmpl'
                        id: '099418b8621e4106b542bb9cdb9ebf6b'
                    }
                    'nv-doc-type-annual-tax-statement': {
                        table: 'x_335329_sn_hr_erp_doc_type'
                        id: 'ed7806362ce742aeb464c7ae17236efd'
                    }
                    'nv-doc-type-leave-balance-certificate': {
                        table: 'x_335329_sn_hr_erp_doc_type'
                        id: '60218345c94a4422adf17b1a3058d7f8'
                    }
                    'nv-doc-type-pension-statement': {
                        table: 'x_335329_sn_hr_erp_doc_type'
                        id: 'e75fd56869f34ed5b6a24ce4f74c764a'
                    }
                    'nv-doc-type-visa-support-letter': {
                        table: 'x_335329_sn_hr_erp_doc_type'
                        id: '3cc5d620c71548deaa9f113b95691214'
                    }
                    'nv-policy-banking-iban': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: '0c04c9a5a130458fa9645fd2ece027b0'
                    }
                    'nv-policy-compensation-change': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: 'a8bf96ecc32b4b5fa1b39e29732b4e7e'
                    }
                    'nv-policy-compensation-salary': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: '3f673b0dce6549b8a99da063cad0f080'
                    }
                    'nv-policy-doc-salary-certificate': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: '46fec11fc5a444e790c42ed300342a18'
                    }
                    'nv-policy-doc-visa-support': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: '02283e0869854f3a917e63f1957dbead'
                    }
                    'nv-policy-expense-claim': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: 'd480432406fc4189a979ae5561800d6a'
                    }
                    'nv-policy-termination': {
                        table: 'x_335329_sn_hr_erp_write_approval_policy'
                        id: '9a6ada65ecc348e2becd423e734a42b5'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'ab1b6c76e2574558b55e6653b237f00d'
                    }
                    'prop-asset-eol-within-days': {
                        table: 'sys_properties'
                        id: '2f41d1174bc946c1a949e5ee9f94b93e'
                    }
                    'prop-asset-high-value-amount': {
                        table: 'sys_properties'
                        id: '5f470c9dd156467eb6a6052b41c19ca2'
                    }
                    'prop-asset-maintenance-due-days': {
                        table: 'sys_properties'
                        id: '7994a350b52d44bb9a5b5070353a8ee2'
                    }
                    'prop-staging-retention-assets-days': {
                        table: 'sys_properties'
                        id: 'e86aeffb68694573b44b0a6f7ea9f792'
                    }
                    'prop-staging-retention-days': {
                        table: 'sys_properties'
                        id: 'b28268bf9b1a4670a94808229b53e837'
                    }
                    'prop-staging-retention-inventory-days': {
                        table: 'sys_properties'
                        id: '9031cd0cd6de41c5a8875e30bf8d2540'
                    }
                    'prop-stale-after-hours': {
                        table: 'sys_properties'
                        id: '794dd39af2dd42139896418c023f079f'
                    }
                    'prop-sync-run-retention-days': {
                        table: 'sys_properties'
                        id: 'f8948de8cfd646f6a6713979b355b285'
                    }
                    'src_server_api_hub-data_ts': {
                        table: 'sys_module'
                        id: '8b762f04fe214c4fbfeab1530ef7f9d6'
                    }
                    'src_server_api_role-check_ts': {
                        table: 'sys_module'
                        id: '5085a721fd8a4490922dc96a512a0427'
                    }
                    src_server_api_routes_ts: {
                        table: 'sys_module'
                        id: '5298e4323ed84a7f91da8ee8daee2387'
                    }
                    'src_server_api_state-resolver_ts': {
                        table: 'sys_module'
                        id: '92a0f279a7fa4fc5bd413e6fa20234f8'
                    }
                    src_server_api_tabs_ts: {
                        table: 'sys_module'
                        id: '2850770f8d6c46938c02a960a9459ae5'
                    }
                    'src_server_business-rules_annotate-object-map_ts': {
                        table: 'sys_module'
                        id: 'a6705f36fb8f423aa324c34c937314d7'
                    }
                    'src_server_business-rules_validate-erp-system_ts': {
                        table: 'sys_module'
                        id: 'c147e225d01d419c875a0c1adda2a9d6'
                    }
                    'src_server_business-rules_validate-mappings_ts': {
                        table: 'sys_module'
                        id: 'd9abb38255e443aab3f1db6448be009c'
                    }
                    'src_server_business-rules_validate-staging_ts': {
                        table: 'sys_module'
                        id: 'e40d627b424d4917b411d5ff4fc6b04d'
                    }
                    src_server_connector_backoff_ts: {
                        table: 'sys_module'
                        id: '6ee6fc8cd34e4df0a0ae25c98f906da8'
                    }
                    'src_server_connector_binary-client_ts': {
                        table: 'sys_module'
                        id: 'b16c362033814b2c81792a78f23946e1'
                    }
                    'src_server_connector_call-log_ts': {
                        table: 'sys_module'
                        id: 'cfd22e1761344f82970b9cb0611f2d47'
                    }
                    'src_server_connector_circuit-breaker_ts': {
                        table: 'sys_module'
                        id: '813b26356b9d4c21a566b2beab60025a'
                    }
                    src_server_connector_classify_ts: {
                        table: 'sys_module'
                        id: '345639e84d6146e1885bad1226b29060'
                    }
                    src_server_connector_cleanup_ts: {
                        table: 'sys_module'
                        id: '6711b408250240a989a0130d877b4d77'
                    }
                    'src_server_connector_config-loader_ts': {
                        table: 'sys_module'
                        id: '665a1ea6996343df86cddd702e45ba40'
                    }
                    src_server_connector_constants_ts: {
                        table: 'sys_module'
                        id: 'a3c4502bd8404803aa5497c7245c6e19'
                    }
                    'src_server_connector_erp-connector_ts': {
                        table: 'sys_module'
                        id: 'e3591b92c4b64153adeefda62a48e8bd'
                    }
                    'src_server_connector_field-mapper_ts': {
                        table: 'sys_module'
                        id: 'fb5be7d9e18743f2b3feef8ecfd63fec'
                    }
                    src_server_connector_harness_ts: {
                        table: 'sys_module'
                        id: '3464bb042cc648a38bd1fbf46fda6f82'
                    }
                    'src_server_connector_rest-client_ts': {
                        table: 'sys_module'
                        id: 'ae43ddfeef7b4bc7b7c5ba3baf321159'
                    }
                    'src_server_connector_test-driver-a_ts': {
                        table: 'sys_module'
                        id: '1d0e87f3671643999c39042f4368bff8'
                    }
                    'src_server_connector_test-driver-all_ts': {
                        table: 'sys_module'
                        id: 'e7630e248d914948afaa937a9c67b4df'
                    }
                    'src_server_connector_test-driver-b_ts': {
                        table: 'sys_module'
                        id: '58674ee7246f465d81dcd36e527cc19f'
                    }
                    'src_server_connector_test-driver-l2_ts': {
                        table: 'sys_module'
                        id: '8009a5fe58124aa08b1a2373a19c6779'
                    }
                    'src_server_connector_test-driver-util_ts': {
                        table: 'sys_module'
                        id: 'fc0bc1b9e5314742a09c35351e35fa57'
                    }
                    'src_server_connector_test-driver-viewer_ts': {
                        table: 'sys_module'
                        id: '100ccbd73f8942f886632b273ec6add6'
                    }
                    src_server_connector_throttle_ts: {
                        table: 'sys_module'
                        id: '38623c3dfaf84c358728aa388af175b7'
                    }
                    src_server_connector_types_ts: {
                        table: 'sys_module'
                        id: 'd5e44b8e8b2d46d3aacd6bb1954f231c'
                    }
                    src_server_connector_util_ts: {
                        table: 'sys_module'
                        id: 'df9a95d01775488886ecd2717e8cf1c1'
                    }
                    src_server_contract_objects_ts: {
                        table: 'sys_module'
                        id: 'edd1b50d0fed4885a7dd977d4e618733'
                    }
                    src_server_contract_promotion_ts: {
                        table: 'sys_module'
                        id: '72ae5722c8d3408eb223de03c92bd5f8'
                    }
                    src_server_country_ts: {
                        table: 'sys_module'
                        id: '789250e6e4d04feabfdd8f606d0c7956'
                    }
                    src_server_ess_benefits_ts: {
                        table: 'sys_module'
                        id: 'a0c3e449b5b2408d86c45bf850864562'
                    }
                    src_server_ess_prefill_ts: {
                        table: 'sys_module'
                        id: '971ec1c6adac4bfcb4f1705934e9b26c'
                    }
                    'src_server_ess_read-service_ts': {
                        table: 'sys_module'
                        id: '866fc08160294e64837f85aa3bba3106'
                    }
                    src_server_ess_routes_ts: {
                        table: 'sys_module'
                        id: 'bc00c8c82f9b45bab07183f1b30d89d3'
                    }
                    src_server_governance_landscape_ts: {
                        table: 'sys_module'
                        id: 'ffb5309da4c54d608c45145db0197498'
                    }
                    src_server_hr_archive_ts: {
                        table: 'sys_module'
                        id: '35acba9a45684c398a46cfd519f832b7'
                    }
                    src_server_hr_assemble_ts: {
                        table: 'sys_module'
                        id: '79523e7928db44f49517b596d41ad584'
                    }
                    'src_server_hr_release-gate_ts': {
                        table: 'sys_module'
                        id: '068a458f3f804a228948af027301184a'
                    }
                    src_server_hr_render_ts: {
                        table: 'sys_module'
                        id: 'c6c19aeb6b694cb78d476e87e59674bb'
                    }
                    src_server_hr_rules_ts: {
                        table: 'sys_module'
                        id: '0f221c086a814195afb89cd5f0194891'
                    }
                    'src_server_hr_template-resolver_ts': {
                        table: 'sys_module'
                        id: '4e011d82152a47f69c5c7c5ed4adcf05'
                    }
                    'src_server_mapping_apply-template_ts': {
                        table: 'sys_module'
                        id: '074acd0404e04aada107acb998c8362d'
                    }
                    'src_server_script-includes_erp-connector_js': {
                        table: 'sys_module'
                        id: '0dd945a2a6b74a5eb8ddc7bfad5b279b'
                    }
                    'src_server_script-includes_sync-engine_js': {
                        table: 'sys_module'
                        id: '6585e2aece2f438b99932a8e16b82403'
                    }
                    src_server_sync_drainer_ts: {
                        table: 'sys_module'
                        id: '91310b97d536471782bcbd76b1308a1b'
                    }
                    src_server_sync_engine_ts: {
                        table: 'sys_module'
                        id: '75b8a3af429c455db6fc7ee6c7fca581'
                    }
                    src_server_sync_retention_ts: {
                        table: 'sys_module'
                        id: 'c1e41dc47abb4a5a845b45e727cdc1a0'
                    }
                    'src_server_sync_test-driver-l3_ts': {
                        table: 'sys_module'
                        id: 'f00137c489a346b097f0b7ddb7de2c25'
                    }
                    src_server_telemetry_ts: {
                        table: 'sys_module'
                        id: 'b7d3af25372649f389deab4e6f5f2cb8'
                    }
                    src_server_util_bool_ts: {
                        table: 'sys_module'
                        id: 'a81ec4bf209a455d8095bac857137fd2'
                    }
                    'src_server_write_approval-gate_ts': {
                        table: 'sys_module'
                        id: 'e1e90fd6f36e4d37b8f3b9eeae8971d7'
                    }
                    'src_server_write_compensation-change_ts': {
                        table: 'sys_module'
                        id: 'd2ed89b40ee1499d9514da04fed81840'
                    }
                    'src_server_write_country-check_ts': {
                        table: 'sys_module'
                        id: '48d8c1a3e3a640aa821542c07cc36e7d'
                    }
                    'src_server_write_create-write_ts': {
                        table: 'sys_module'
                        id: 'bc0157ed212b427899cea24fbd6c8022'
                    }
                    src_server_write_cutoff_ts: {
                        table: 'sys_module'
                        id: 'ebef965c3e014e14abbab1db1c5e9287'
                    }
                    src_server_write_dispatcher_ts: {
                        table: 'sys_module'
                        id: '0e6e200075d54dcdb1be087f57040265'
                    }
                    'src_server_write_exception-queue_ts': {
                        table: 'sys_module'
                        id: '3aeb17fc6e6a457daec92384b15d28f8'
                    }
                    'src_server_write_expense-claim_ts': {
                        table: 'sys_module'
                        id: 'b1575689b17e403f9ec5fac43b167185'
                    }
                    src_server_write_idempotency_ts: {
                        table: 'sys_module'
                        id: '2b61818bd1ff49179fdffe09788897fd'
                    }
                    src_server_write_identity_ts: {
                        table: 'sys_module'
                        id: '8691ba94e3b1430b81926458b91fb267'
                    }
                    src_server_write_offboarding_ts: {
                        table: 'sys_module'
                        id: '1af33bb01ab9492ebe73e7b041214b6e'
                    }
                    'src_server_write_personal-update_ts': {
                        table: 'sys_module'
                        id: '4ead038653544bc8b058c9ae65cc609d'
                    }
                    SyncEngine: {
                        table: 'sys_script_include'
                        id: '3957c9c6c1814961bc652481abc8b706'
                    }
                    'tmpl-dynamics-365-fo-backorder': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '269371161e75416b9277fc1fdd499bd0'
                    }
                    'tmpl-dynamics-365-fo-balance': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '7fb175e095df46cf9db5ce49210192ee'
                    }
                    'tmpl-dynamics-365-fo-gl-summary': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'dc12a825268d442f83f6441b66b0b405'
                    }
                    'tmpl-dynamics-365-fo-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '3d0e7afa383241fda6ffdd30ff6d43f4'
                    }
                    'tmpl-dynamics-365-fo-stock-item': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'b1affd7bbb574752a508123699a57c9a'
                    }
                    'tmpl-dynamics-365-fo-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '54bee2f081d34ed78c93995ff407cfa8'
                    }
                    'tmpl-generic-odata-stock-item': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'bbd8b7e5158e4ca28162093047f8bc25'
                    }
                    'tmpl-generic-rest-stock-item': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '8e0567064d8c47c39d8af9585a31887b'
                    }
                    'tmpl-infor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '93290a5432684c30b934d096c3acd659'
                    }
                    'tmpl-netsuite-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '6ef335d98f3d4e5cac94a0bd2a7ad129'
                    }
                    'tmpl-oracle-ebs-balance': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '4522b066aaf0449ab97120b5cfcaee6c'
                    }
                    'tmpl-oracle-ebs-gl-summary': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '17608f31214344e0a69e8cd1e4c72dbd'
                    }
                    'tmpl-oracle-ebs-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '32fd6f2108644fbab9ee4d67fe07d956'
                    }
                    'tmpl-oracle-ebs-purchase-order': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '2ca8a6a14ac3438ca1be24b371370171'
                    }
                    'tmpl-oracle-ebs-requisition': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'ca07dd1dfa18456296940321f447c10d'
                    }
                    'tmpl-oracle-ebs-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '7e80fc0a7fbb4ddfb21ac8f54de5669d'
                    }
                    'tmpl-oracle-fusion-balance': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'a39b8ff4d14f4f46be6eb415ae1541cc'
                    }
                    'tmpl-oracle-fusion-gl-summary': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '723c9a4cc6384bf295309f323fe6da38'
                    }
                    'tmpl-oracle-fusion-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '2f334a8b36b34bbf9aa0480d53d0bddc'
                    }
                    'tmpl-oracle-fusion-purchase-order': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'dc55d57cc9a2428c9b2159b49e1156e3'
                    }
                    'tmpl-oracle-fusion-requisition': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '20cbb4b24c014c64b0fb97f6039fcc85'
                    }
                    'tmpl-oracle-fusion-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '8d4ebe75e3b6436cabb3feb7ef3d96fd'
                    }
                    'tmpl-salesforce-fixed-asset': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '9ba381d22c2e4b0fa1972c9bafc11126'
                    }
                    'tmpl-sap-ecc-backorder': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'ca33c42a378b43459fd18748ed2b58e1'
                    }
                    'tmpl-sap-ecc-balance': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '41b153ba29ef40408e81f1502a728ba0'
                    }
                    'tmpl-sap-ecc-gl-summary': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '62e5286a36864ceca953d976881f229b'
                    }
                    'tmpl-sap-ecc-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '52fb171db95f4c91987af2d833e9db41'
                    }
                    'tmpl-sap-ecc-purchase-order': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'b008f377aba9459eaf9dfe10ae263dbc'
                    }
                    'tmpl-sap-ecc-requisition': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '7434040ca9c643dca917c03871fc82e6'
                    }
                    'tmpl-sap-ecc-stock-item': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '19f314e7fb5d4554a833ea63c5c55256'
                    }
                    'tmpl-sap-ecc-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'a8df5d72fd1f4eda81f35f00dac172fb'
                    }
                    'tmpl-sap-s4-backorder': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '5075a9c49f5e4a5784ad389a96cf6470'
                    }
                    'tmpl-sap-s4-balance': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'da3a61fef7694cb99814a278f0d7a1e9'
                    }
                    'tmpl-sap-s4-gl-summary': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '722f3956a35e422a9198d2fceea827cf'
                    }
                    'tmpl-sap-s4-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'c3bca36bee8b426cb59bf5cdbb1dbfab'
                    }
                    'tmpl-sap-s4-purchase-order': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '2562d0d9a8ae4b788eac29765535e791'
                    }
                    'tmpl-sap-s4-requisition': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '64e6674f5327440489aa5cb928173871'
                    }
                    'tmpl-sap-s4-stock-item': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'a99dc9137c6c43c0a1dedae619f7cc9a'
                    }
                    'tmpl-sap-s4-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '76082596afb9405ead2893aaf996559b'
                    }
                    'tmpl-unit4-balance': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '0e77df67e9764625a8ff306c2f7ac955'
                    }
                    'tmpl-unit4-fixed-asset': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'db09abfa13204ca48ba39a2aab02d431'
                    }
                    'tmpl-unit4-gl-summary': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'bab4dde200554620aea94637204a411a'
                    }
                    'tmpl-unit4-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '58d201d135a34508a4aefca994bb7e19'
                    }
                    'tmpl-unit4-vendor-invoice': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: 'd4db12f15a1b430ca9f233ec39cec93b'
                    }
                    'tmpl-workday-requisition': {
                        table: 'x_335329_sn_hr_erp_map_tmpl'
                        id: '55af52e7dc754610a0d5a56976c03901'
                    }
                    'ui-action-apply-vendor-defaults': {
                        table: 'sys_ui_action'
                        id: '1f9183524ba04783bbb866cdc0ec6897'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice_set'
                        id: '00309f5162724291b56ea6e04969ddd9'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'oee_input_scale'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '005f69297bef477294d441f6f6f1c427'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'max_attachment_bytes'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '00853d72ee1640048705e611744d8068'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                            value: 'not_configured'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '00bf8765116a4e0482c7294bd8a12d1a'
                        key: {
                            cat_item: '84ed5f41094747f58577f2e76d1d9bf1'
                            variable_set: 'NULL'
                            name: 'subject_employee'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '012292bb95c8451bbd4e68c54e539482'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'external_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '015d447c242b4ea3a6ebe42f5900a799'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'effective_cycle'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '01cc63826b31437eb1869d1c5e27b1e4'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '01d9a7d0bb834f2c8a525bc4a43a3cf5'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_doc_tmpl'
                            col_name_string: 'document_type,country,language'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0241f868ff5548fdb0a720afb66ff292'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'use_mid_server'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0255d3ff9e7942eda5e021a01a2db210'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'change_type'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '027ed318fb4a4f37a41dbae963dfb921'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'location'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0309611370644608958c8c8fcd41b66c'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'operation'
                            value: 'read'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '033c8d099a764a3dab0e4eb30e1d291d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'rate_limit_per_min'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0362a5f368ca4fad9a5f48bc6febce06'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '037747b7d5e645499a50d122e7b75543'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'sent'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '03de25c1e449434f9611594f3a56cc9d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0446d63c1a1546beb2e2da00bda84ed8'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '04a63bc46b074018be1eca549cdeecff'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'status'
                            value: 'pending'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '04a64cfececa494f8506b3a628b25486'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'occurred'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '05732d22a3c7484cbcc7cd7fd35c325f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '05cbf748ec6f4e3bb05ce815a0f728b7'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '060b4558804341b98ca277e5aa793980'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'ratio'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '06a3660bb6d54b4498269b52ed9edcb0'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'short_description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '06b8b96b17f1486a86e1d24da3ce9ce5'
                        key: {
                            sys_security_acl: '09dc9a297ca7448cb5333678c53c1817'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '06f815a5d3934cd09fa2c1b6ec60de2e'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            value: 'next_url'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '06fafeb432a84e328d445c30ad8304c0'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'annual_gross_salary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '06fcb61f52c6428ba8d5f96bf904af2c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'erp_write'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0732b4b711844e239dafecbd077aaab6'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0749da0d47eb4377839d126e49378153'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'source_note'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '07c4cbdf2ff04c84885f53090300585e'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '07c8d63278364dc9bfeee1030bb72c5c'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '07cc4331868b48559da62bc791c4c947'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '07fb5a8fe4844936a3c4c68fd87d6e78'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0826c97b6329476e9ff8ed9f42b217c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '08783c3c89f4406db1d8f1aa443177cd'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_call_log'
                            col_name_string: 'started'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '089bb95a782a475187fb2d6a80e72d3c'
                        key: {
                            sys_security_acl: '7390d857682246f0a454a5ee5ffe8c5c'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '08b809592e2f4a8c8e99f34c2fe0c00a'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                            value: 'failure'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '08c5c5fd759b45a8bd346c952c2acd81'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '08cdf97ca704470cb86001f5c0877276'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '090f4059c46543c1b379d232f97099c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'source_field'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '091e99c2bcc242e6989ce6e4cde785ce'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'expected_latency_ms'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0992b08a2353455b9a22923926096bb5'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'call_log'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '09e5d32a13324c3ca46bc58dfb4973b8'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'elevated_sensitivity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '09f4e015f79e4965adbad49cea91a2f4'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0a2503ff324a4be4bdaa3492f5b1c866'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'approver'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0a2821429bb54fea9fa2facfdfc8731f'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'total_amount'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0a2f90144fa84ef2bbe241417d105be3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0a37a9878c824e35a255c07d724c40a1'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0a417511eb5c4c208092e1b4e435cb63'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '0a45ed8e2aef466e9844be193c300073'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '0abcae7592c646d3a621fb0856a17a09'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0ad3f6a110fd41fc80e12cd0d1d0132a'
                        key: {
                            sys_security_acl: '402f66d7e8014edcb129a1675ca2ba2e'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0ade43b42c584c21ad4a39a0287a97b3'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0b0a19ffe7c14b77ba9c985eafae01ca'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '0b2bc50670f8469aaeb3c9498d122b09'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0b7c6e68895143da87e976858dc1d90d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'sap_ecc'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '0b830a9b52d4458a930d34825f379177'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0ba832887a9f4d79baa7213cf99982dc'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'state'
                            value: 'resolved'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0bc0b5ab9255425bbc41c5e3fe313aeb'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'duration_min'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0be0c77481f844e38512ca1a9b15a952'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'rows_fetched'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0be4559b311c47769673e549e6d446d0'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'started'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0c58808875e549ec973e248abeb08b45'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'confirmed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0cc0bfba8f374753961718b84ab16434'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0cd3db8a4a2f4e68964bbbee61379559'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'erp_employee_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0d188502a1444f87ad4a188e8802eb56'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'currency'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0d1ef862d6e6445090cb08ebd35fca69'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0d276de036564e9ba6a811c8c2b1445c'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'next_period_label'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0d43bbc081394b968cbbdc8fe8fcd702'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0d4eb4e259ab4abd9adcc8c9c0ec40c5'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0d6c58d520164ffeaedbdc2da299411b'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                            value: 'inventory'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0d6eb7c91bad46489cfeed2f6d58b946'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'operation'
                            value: 'create'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '0d725b70d93647d1af7c843fa8da56ec'
                        key: {
                            name: 'x_335329_sn_hr_erp.hr_viewer'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0d94abb1f4b645b495cd5b421a509d24'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'source_call_ids'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '0dfdba2529e54715b58775c1b6e1281e'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0e31f30009b140fcaf0762bccedc642e'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0e36525ebe3d403f9ad18d01b721543a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'account_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0e3bf2f73f88460bacb671936b5342ea'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'dim'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0e3ce0e27cdd4df286aca364067982c5'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'duration_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0ee8c992c8ec470ea50bcbfb436f0503'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0eef62250f824d28a5557ddbeb87528c'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                            value: 'core_erp'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0ef4212859684687816f8a5338f4dcee'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0f0334b373924c8db9ca095600a09609'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '0f0c02500c7c4da7b2358ad2a1a45329'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0f9271a16af7497ca91227f6b1b751bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'deprecation_notice_days'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0fc5fd6c0c8247608e52f37d9a4121ba'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'cutoff_datetime'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0ff08fc33b5c4c81b6349df93e2c2e24'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'threshold'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0fffb010a02e49758b7513b1edade32d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '10de819cf8c742cf91dbd8f0286484f0'
                        key: {
                            sys_security_acl: '3be9e11456e048b8ac7827a82988a861'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '11031a92b26c4e7ab34910721c4d2504'
                        key: {
                            name: 'x_335329_sn_hr_erp.viewer'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: '1130a354d8d04b92a71b19b41c842d3b'
                        key: {
                            sys_ui_action: '1f9183524ba04783bbb866cdc0ec6897'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1173c1a8d9ba4105a61e2b6b008dbc38'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'expected_latency_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '12431a2542a545108c38f1a070aeba75'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_usage_event'
                            col_name_string: 'requirement_area'
                        }
                    },
                    {
                        table: 'sys_ws_query_parameter_map'
                        id: '12a3546cd5aa4b82a24bf89708f9f683'
                        key: {
                            web_service_operation: '29dca62e37384a68b9e4af4eaf3c73db'
                            web_service_query_parameter: '0f7d84c1c308400882ad2a891adbff3d'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '12a5d793e2e043939065cc5dbd467aa9'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'document_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '12aa908fe9f2471f90d3cb3d9b00dbc2'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'vendor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '12b1cf8e2b5d4fbd8426488d246839a9'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_verified'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '13192adb5c284b8fa3435fc1644459ef'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1350c85287e84fd28171a261779b037b'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '135b859334094439bf8d8bc28b4f4519'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '137ae741636147e6a891e00ec5652982'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'delta'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '13a7a59cffc9406bab44445954818eae'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '13c9a96ccb734ebc99e38033275c1d49'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                            value: 'none_identified'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '13e0990b62dc4cc5850c3b31f54d64d1'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'action'
                            value: 'view'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '13ea18fff77f4f63b327e32abe3246bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D3'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '140fd572c39f4623a46bd496be29d09d'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D9'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1419869708b248588433359511d545fa'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '142b15e5272c449c9870e670765c0793'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_exception_expires'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '1464da8d61714d69a1f803320fab8826'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1476cd0bde074e84bf23f24ae0c661af'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '147d899e553946a28f929da60934fb08'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '14a32c81e8914d03b70b3c1d91209b64'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'endpoint_path_hint'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '14c18b86de614fcd99e6c819c1420f1a'
                        key: {
                            sys_security_acl: '03bc0a60753245bab7ec955cd629ca4d'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '14f92d2bba3b44eb99a126dfef88d8c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '15564783cb2144bda42617251082cf05'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_profile_mutual'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '15db960d45a4449f8bd8383abff18761'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '162d84d885a74915908f256852b8c360'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'page_size'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1660dbec9340492592836dac0de6fb10'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '169f565088e849f5bb41f1480d3add7d'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R2'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '16b5fb369b4b442f8f76ce05deb57437'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'lifecycle_stage'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '173769038dd34a37ab83daa4fba8b5fe'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '175bd368dfe5478f9f102818fc8c9686'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'native_timesheet_workflow'
                            value: 'yes'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1764d9aed5f848358a0547cd61b8317b'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '176bcb14fb224db4bcfda15dbbc5e910'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '177676aca0164d9eb55e210be691ac26'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'number'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '178c5645f11542c883096ffb21e545d0'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'sync_run'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '17ab6298c3e148b3b2dc8f42b8194544'
                        key: {
                            sys_security_acl: 'df348789220b4bd3b22aad5a6013b35d'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '17e20846a14245f78968d7117d0a5401'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'endpoint_path'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '17e2a8b4d90a4f70b08655e4756547a7'
                        key: {
                            sys_security_acl: '7298e6efdce2443db8f6013b417cfa90'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '180f8eca5a85499e8f9f101bee5622df'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                            value: 'not_applicable'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '184bd1ad847c45c9a214b532fec497d5'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '18ac2bd9a3374963bf3d75905bde444d'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'object_map'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '18ad2f8e57bf4fb28935478cf20eddbf'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D3'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '18b9982103ba44c4b965845e5b9ee651'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'confirmed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '18d34c8539af4d919a00cfdf8eb6db70'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1930513fc94f4a1ab6246c9db0278728'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1959d88175854777a324ac3b30434fec'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'document_reference'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '196ce864ee134f95a8e0ada30f0eb106'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '19b5376539d6442bb21528b21ef91095'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '19f460492b2a491f8870300072f3ecf4'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'approval_required'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1aa1ae6fcc9041b5942ba34ae0285364'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'trim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1ab436e49a4043a1864a3bde7fea85df'
                        key: {
                            sys_security_acl: 'ee1e120a2888421fb6b81fb370dd1b82'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1b28cedf0d69479982bdefb2b8fc8389'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'next_service_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1bf37fda49304b8eb177e92784301c69'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1c1782bfda414b98a88964b43ffdf331'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1c263a592cc044dd90d0e7b1a242e446'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'oracle_fusion'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1c4cb156f9ad4d4ebe39a2e922ef96e7'
                        key: {
                            sys_security_acl: '4a6e7e025a4c493b99ae09afc15e69ad'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1c66d8df3cf34d2781ff234f3a6c290a'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1c6a04b12f1e45f0b89e8280a7a5a51b'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1c6e641aff69499aa9579d5f898b2511'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_exception_ref'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1c9ab98be88342bbbf05f40171759e40'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1cf2b8e5e2114f92bfe3f0ee57c9cd5d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'rate_limited'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d0deb9c7cf64b18a0bef24ee88247ed'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_header_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1d1cac319dd7404d8ef4fd482cf35ca9'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'mapping_verified'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1d395147b0b54bbd99760bb7e7d74cd2'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'field_map'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d4adef799a946b6ad9ad8192ea37ff3'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '1d4bf8381e2a4bf39dc70fc863fc0a3a'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_erp_write'
                            col_name_string: 'erp_system,idempotency_key'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1d7a6303dd3a4ee4bc5faeb8305fe9bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                            value: 'manufacturing'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1dbe1ef6726544739cd3536b80b8f518'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'sap_ecc'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1dc5199d799142a9a297b5cd2e28c694'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'output_format'
                            value: 'PDF'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1e0834b4c27442e590450f8a04c59ed3'
                        key: {
                            sys_security_acl: '52a18ca1feb64e5aad25e08011a21b0e'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1e1822861d7f4b31bd43cc7d64fd4aa7'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'checklist_item'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1e717c3500214b01bcbd30cf5cd76622'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1e7b42174ab04924b7eab34883d4334b'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'max_attachment_bytes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1e928623bd9540c8ae129c9ca2a62196'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'percent_to_ratio'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1eb0aa53bf7d48f1b6d6c5815bbfc594'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1ecf718496cd47b0a4d8c1afaf8110ad'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1f1033fb477b448d945b723acd87081d'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'deep_link_path'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1f1ad0a4472b444b83a6d6b0adcc58d8'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'end_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1f1fad92eca74d2d8f7d5332d2f7f62e'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'native_timesheet_workflow'
                            value: 'not_answered'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1f278e365023421d92070f8f1e0ac927'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'erp_ack_ref'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1f48683e7f9b43ab9ab37995f6aad3bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'legal_entity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1f5e3430862e4fbbae5f514ac00df4fb'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'oracle_ebs'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '20952de2aa234af6b57c2710c0150ac9'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'erp_id'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '20b622e041474f61bf757ba942ac91a0'
                        key: {
                            sys_security_acl: '44108c6d743e4949a4c4171651b19f54'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '20df944cf9734708b23936c4af8a7130'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '216b42c91dd74e9ca9d3bfbeb1e80208'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '21890f1d3d0048dd91dd6187519590b7'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2189374a6e2e441d833acb456de24b77'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '21b2c40b496b4d14bec62d21baf207e8'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '21ed7be5fc1840a88601e05b67bceff4'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '22c4ed455125489bb84ed0ec8a3c06e7'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '23534a583d674702ac2f16d85ac9eac4'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '23b297b68fe64ef49380e3f0256f6b69'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'dynamics_365_fo'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '23be8c3de09843428f41cded8bab7de1'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'idempotency_key'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '23c3f3b64a01401fbca24ba5b1470343'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'deprecation_notice_days'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '23fa188a61384fd38cfc2d141daab5c8'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'language'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '241b6443a78b476db80ae057c54c12a0'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2456bc79cafe4955b226567d69ab1b7e'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '24676825483545e3bd288ad633435f11'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '24b47ea953344af0a6d6453ea785f410'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'gross_annual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '24ecab1e89014afeaff4625fc6bc89ee'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            value: 'page'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2591eeb8eaca48ae864d4fac3f353b9b'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'endpoint_path_hint'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '259a7c0b460a41388dd3f5f68efc2689'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'call_log_ids'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '25f4b0b16b8a412e8b601a28b2d6df8e'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '25f5f6dff5174d1dadd2e7947b6173c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'generic_odata'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '266e6edf401e44799603afaeb7c0e3aa'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'address'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '268772673d384ee9bdcf5d739fa2a653'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'performance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '269a6fb56a9f4951889d22ca60784139'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'net_annual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '269c785c55d04a58949ac078b2cb677a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'request_hash'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '26a18b7094524f3c950fcbbe9cdb63f6'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '26a7ac3d7f6a45409aba847dbdcf5be3'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2735d87876174d9983ba62fa29149ac8'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '275245bfb6814b198c01d912c687ff23'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '277902eac99d426984446bc424bef11c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_exception_expires'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '27a6c8d6a91e43a5b92a76f2c9034fae'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                            value: 'success'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '27b3128f9c7a4b939afe94e219c155fb'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                            value: 'assets'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '27ee407dd5544119b8f8a30d9357e970'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'action'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '280b7d98a85d42908df01b4f19e57b90'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'operation'
                            value: 'create'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '284ab2a3ac2f4e62a860d52f0da401c3'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                            value: 'assets'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '284e0df216cc45c7a33e6fe9854341da'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'api_version'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2883b0cd828d45f58f613b8073838979'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '2920799ddef941b2b59c643f59ed8672'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_sync_run'
                            col_name_string: 'erp_system,logical_object,started'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '298d458e88774395bb15e24cd74f3dd7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'max_throughput_bytes_per_min'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2a687b48a09444e9bfec8c7aa9e1e10a'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2a7408e9d2e749d3a0b05fa47d7059f7'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2a8e86bb76234c789f0b658d009b48cf'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'job_title'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2ab7cec6c0244a308d4fe6f861831a01'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2aec4bf0a3e34e2b834e950493c3bdef'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'linked_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2b11f988538c4e9abe6101a28688afe5'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            value: 'basic'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2b401eb48849431bb7b14609ccaa906e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'effective_cycle'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2b85106ac9f14c35ae529c338cc96500'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'throughput_source_note'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2ba80711a2fd4289b76d11c3afb27185'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'requester'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2bcf6a90621b4475aefeb454d9cbd2d8'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2bdaa884562d4e50b3f579de1a966e83'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2c3584e7bef54f1c84ea492fe815e307'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'erp_role_or_scope'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2c4913b0b8f4412b8d6da243f8adcfd8'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                            value: 'not_configured'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2c73996358de4990a4fbc647e7811ef3'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'balance_value'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2c8e7fe3c7804b4ab783bba35a7a2b1b'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'max_throughput_bytes_per_min'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2cc59eb3838547a6a527a33456e13491'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'request_hash'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2ce15af4a49d45b18a75373875e61a3a'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'source_note'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2ce76f91ebac43b2951c54367ed4d9cb'
                        key: {
                            sys_security_acl: '2386bee64a384f82ac1f363c0f9a115b'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2d163daae37e4be4b4216a7acc2f82f7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2d4b25b62bd4402fae0fd1e08da4b8ff'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'retrieval_path'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2d59d181262b46ed9a31e6e808278f72'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'output_format'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2dfa99b1eb2341028382dedb9a7c5532'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2e1f19dfc9f349feab3551a29cdf1edd'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'unit'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2e200c5fb2784027b3f5bab4e58660bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'period'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2e4710b0a2514883910ccc0789185cc7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2eb96a4661f841bc9ebe473b28f87325'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'effective_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2ed39f9d7bb742919347bdd51b3511bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'status'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2ef4b1b06c3f462080b40f4903af9777'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'entry_status'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2f194e4d43694e59a1ef9d40c36e7636'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'document_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2f2fa00f0dd74f63bec6b69c99505a5e'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2f450cf40801478d9f154ae49a30f35f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'endpoint_path'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2f4b90c5bdca4850afe07071285bb346'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'verified'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2f62470262fd423f8d50fdfd9cf1774a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'environment'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2f94bca562fe4efbad37cd2cec88bf3a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'oracle_fusion'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2fddf947f0ae4013a85cfed95d1caa9c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'vendor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '300808d7e9314eb9b8d62bbb02ae6d7c'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_payroll_calendar'
                            col_name_string: 'erp_system,country,pay_period_label'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '303565ae69ac4eefa6bf8d2a44530f83'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'erp_write'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '30552c018b9840029ace4d9bd5a57295'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'blocked_cutoff'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '30dbd97041e54cbaabb5cc5a94aed8f6'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'native_timesheet_workflow'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '30de136dc03148b8bf626c6d11884274'
                        key: {
                            sys_security_acl: 'fe41a4344b644a89bc34eb665cdab74f'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '316c6887611e4595bba35ee57b88d5b6'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '317ffbbd81d5459b991a95be1172684d'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R6'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '318d8daa83284af09c605baec86cb573'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'environment'
                            value: 'production'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '318e4a3ba0674a85bf98945e99a8ddd8'
                        key: {
                            sys_security_acl: '3a06a3f1ea914c79bc4c4b58d67ca60a'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '319c021a679447a58a9a192c11afd126'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '31d415b3b3db4b51987e8cf2a2e94a68'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '31fde2d767c5479a921c4a3c4feb276c'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'netsuite'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3218cbab112941078fe7b9eb3a9d405f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '32892a124c4d4603abcb88b1ee877df7'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '32a3dc3f6e0c46e2bfb2dd502fe8c6cb'
                        key: {
                            sys_security_acl: '9584fc1050c64898bee1c5272beef317'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '32d605c271df497fafd92b9897e7c901'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'unit4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '32fed660e0564b2593d907c99fe2a6b0'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'blocked_approval'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '3314b33c279644edb339b474ff97b804'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_field_map'
                            col_name_string: 'object_map,logical_field,country'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3371804e92f4497a8b3854e3b1662256'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3389ea5329934c7a97e641fb79569653'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                            value: 'header'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '33e7d057f8ff437d8100ca787c50a6ad'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '33fc83e031c74955b82f324b7b1a27fd'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3406e9991c924b748637d287e0bf59aa'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'as_of'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3442946941ad49659c64f1404af257c6'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'response_root'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '344c3a67788b499ea56a58ccd5dac1a3'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '346b85e358eb4e67a0a293f515508bf0'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'employee_full_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3493601e3b1446a081f6daa33d0e1752'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                            value: 'success'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '34af69a89dfd4563af9c3c522845c8be'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3504e92e9bdf42279648d7c53dd6eea3'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'policy_key'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '35562344265d436a9e0bf04af94584e9'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '35961d6ce649421cbed5e15160f78c72'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'fetched_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '35a485d0dcd04713bba92156dc8b25a9'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'error_message'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '36017fb4d7fc44189e8f0242fadce0c1'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'assignment_group'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '361dcacef7da48348e2d7108c2621049'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '366cd1782cde4193b824511f57273e37'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'requested_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '367bd8c9da8a4eaca0c4c9f1893bc059'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '36e6fe6b39ce4fb7a03434451ecdb26f'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '36e71b75754b400596c008eefae34d19'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3700e0d1c277463aa7d650bd525093a3'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'checklist_item'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3738f3af79574ff0ae189403235ac095'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '375364e98f32421d980aa6275d3fadd0'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3764b0a0e9be42ce8368a9917fa617b7'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '37e30be06d23499492d4a23fd9fe0636'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3852fde1ffed4063aef08cc1be95dec9'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R3'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '38af7dd3273c4a9db9d355434f4de7d5'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'policy_key'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '38b4db737d6344d68d65ad673f65b87c'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'output_format'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '38cf171535164df4bcb14c78ea85f74e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'legal_entity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '38d333df55554c8f913dafa5d542b969'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'environment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '38d7526355064e3d93a048f76f61fc02'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'response_root'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '39027279494d4650b5c370218c04dea4'
                        key: {
                            sys_security_acl: '64d43749138a4bafbc1820bccbe4c02c'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '399782d8f9fb4e489edb9f5a43e7e4cd'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'generic_rest'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '39df764a9c654a939175c9e03b6d8e0c'
                        key: {
                            sys_security_acl: '90ac9c7e2771442fb521f76f374d2dcc'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3a3055c32a644c3385220910587d6499'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'operation'
                            value: 'update'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3aee256ff45d4a58bd20b28464b0039c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'confirm_timeout_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3b1e797ba3dd424fa1caa37122fb5f8e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'employment_status'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3b7604d0753448d88799416bfdd4fc60'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'payload'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '3beec8410f1f4ef6bfdbff635e636556'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3bffd32fc08d4ae488314b9ba63f635f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'existence_check_path'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3c350ecd12384d98b2005ba617e86794'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3c4cdd2c166f447997608b499fd407c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D6'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3c5b0f1f53e846a99e17f14aad38c00e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3c73b091aada42238d9e1b6667c1f690'
                        key: {
                            name: 'x_335329_sn_hr_erp/main.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3c80c3feb21448d7a01035603062d594'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3c856b3ace7d4a8faf6aeb198f4e886e'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3cc6b54e5d674f2e9f998e9e9a67c6ba'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'sync_run'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3d0d6613b56a4c189f6ba978b7a26fe5'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'status'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '3d130bd111d84acd8766f698745b61db'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3d6859111843418197811a4fcc575065'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'operation'
                            value: 'update'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3d7848fb8d3f4283900baae89a3e67ca'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'contribution_amount'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3da42237c18c4a269d9c83cd1b0da923'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3dbdcc1cd9e14afbb2094a757167fa00'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3ddbd164ff554ddc9b53c7e90401b4d4'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3e0ee031d42c4de88c501bbc3312022c'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'existence_check_path'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3e268ac5153344889822745d18f175e7'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'asset_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3e2d7568edcf452198850919d297c13e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3e553057b46b47418515d0da32d3c0ab'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'call_log'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3ee84ba8d6d84f73937135bdcdc88123'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3ef095e6cda04973871d4b968ec9252c'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                            value: 'assets'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3f6535338e8c4e8b9723b8db6b664b66'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3f65d2c036df4c4cae009ec50d29ad67'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'failure_reason'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3fae5c8fd0404997b83b26df497227f1'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'salary_currency'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '3fc53bf161f6468a938e1ff4e1e594f9'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4054881628994b2a81dec7ae8d9826ce'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'attachment_limits_source_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4055f764f0ee4591887f03233c13259c'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '40b3cc713e3a4b82bae9ab01deb77192'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '40d28275b1864900880100d0d1307b9a'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'document_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4109d3a0eb7c4157bece103baf4e0517'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '41803a6a935047b997f6b27804c5e16f'
                        key: {
                            sys_security_acl: '3a522ef8f4bd4e6fa4aeefbf7e860983'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '418dfc427f004d22ae3d51d2de139109'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'required_fields'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '418fdb4db5d147bd87b8bd4684af66e3'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '419c38383437486984b3726d60b4ddfb'
                        key: {
                            name: 'x_335329_sn_hr_erp/main'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '41badeadf55045c9822e7e7a016e2e68'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'policy_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '41d45d79c3eb489e960bf7643cdde857'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'mid_server'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '425b6d3c377948f2b884fe8519f00d72'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'confirm_timeout_ms'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '427c0ce4338d41fe8622cd14ba5040b5'
                        key: {
                            sys_security_acl: '0776c025bd854d0d8822b496f17e9271'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4290c07718be4980b28e11caa0ddb730'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'source_record_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '42ca0e0434ce47d28332ff7845bec7a8'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'unit4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '42e9cc1eeafe4751b10123c8844bd6f2'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'old_value'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '43071b5cb635478ca57f38aaa587290f'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '431aba981abc4ab4a8a5b92abd85888c'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'query_template'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '431e0154f0134d71a6d9a32065ddc38b'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'output_format'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '432170b282b148d499be13ba027cf1c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'abs'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4360188046514597905fd54755da276d'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4368a3f1d1d343b1acf778538c84c84c'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'drained'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '436a99b16ae747698c1b4e469561aa09'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'page_size'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4380c0b14ddb4c199b55cba87b17f5e2'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'object_map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4386bda6bca14f89883cf25824c14680'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'cutoff_datetime'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '43954044b85642d3a4de7247e7f4c95b'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D10'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '43c872f1edc045eeaf7d5058c16c2703'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                            value: 'finance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '44561dcc66154b018cf492fa874a9253'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4497f2f5236745b5975084f1b81a90a3'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'object_map'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '449b8098ca77481785335bf51e0f5749'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_scope_grant'
                            col_name_string: 'erp_system,logical_object,operation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '45043ad3a4ac4460a99c955246fe2402'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'rows_fetched'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '452ccfa63f1342c3aca81b6b3955360e'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                            value: 'finance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '457ff28447be4823be20b11095b18655'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '45a245ed51574e36ac2ed077ddf38e45'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '460af2dd06614ea38125395f4dfa0454'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'max_retries'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '461197bd805e4f9d9f426511742f0492'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'expense'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '468b3fe7922e4c8ea5473786a840302b'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4698b5db951a4b8d964ff30b58e766ed'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'response_root_hint'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '46e7131a45e243df94ead1f01a9a4b9d'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '46f569143be9461d891430680107df1e'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4705569d6b794f3b80774b2d0e2d31de'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '475f65bd8c73415caf9de46b53adaf0d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'upper'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '483fda025b4544c6a08c1bdcc4ee8b99'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'balance_unit'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '488c609b5c704631b4230501d6c8de7f'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_write_approval_policy'
                            col_name_string: 'policy_key,country'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '48ab88797b824422a80ad9fae914a839'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'completed_on'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '48d29f483ea84af0b32adbbda25ea07c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '48df7b3bc81a4bbc9cc120dcb322cc90'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D5'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '49c849e5af814b06b576d71c716a7855'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4a1566b1c8454891a3c61ec495c1c238'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4a8fb81e8309466683be1a1709dc9df0'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4b2cfa2e554b422d95ef381b0a08340b'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4b40cf79dfb047b991950915a40ce0ae'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'erp_message'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4b8a4ccd60ce4a259c0002310fd4d8b7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'max_retries'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4bbabf1323e04989b8ace775c1d72537'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'sku'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4ca45978f0aa4fcc9b51c89a0e17a984'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'timeout'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4cb9727db592452da1a547ab80d4593b'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'duration_ms'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4d3057816ace4bcd9e6e9b06345809cc'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4deea353559b4341b3ff701a7fdbb9a0'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4df8a766ae5e4926ac336a56187252de'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'oee_input_scale'
                            value: 'ratio_0_1'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4e6d9b7971a442f384706d96de1f1bd8'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'approved_by'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4e9263fa958f4ef4953eb0f8db043fe8'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_profile_oauth'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4f7426a4d0f94432a57e059346ec7c21'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'revenue'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4f8fc00b6c584793aa37acc54ed7db82'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority_system_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4fa1699d5bee43a7a879b06090fdfb59'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4fb3501be87b4892b4e9ace12eb9bf98'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4fe2efd555264fb992f7699980801c8f'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4fe67c8a6948485dba0048cab7a8ee46'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'promised_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4ff4350d1e574fc497a8e4688d0763a7'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'new_value'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '500b81bb6f0549049324d8b6130ecd89'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'optional_fields'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '501c71717dc7449d80b0f725f6b43ff2'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'payroll_country'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '50a455d6b5884c8491d34bdbbaa3b01c'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '50d8aa10969d4998ab706af93685c34f'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '5102f6d5cb504c2e94dc7514cc3fd467'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5139505173a749fab1b84367e95c521c'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'linked_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '519d90c11a7d4a6a8b7955e934b701f3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5207e532ba03402292f418b17a66411f'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'salesforce'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '527766343eb8456b8c9261d3cdfdd443'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5297f1c607754e728ce269c1a6522431'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'asset_tag'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '52e66e2941f146acb55e4413ba9219b7'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5363eb03a23441009ed7cc3a3a2498ca'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '53970e3fe6a74178a46ea43c3f335fd8'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'zero_is_meaningful'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '53b6d04b5b7344839065fdff834771b4'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '53c012bba7d245d491a162fde090cea6'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'as_of_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5445d89b6cad4f7dab2ae22d49c23e97'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '547a4647fbde426eaaf59bdf1ba69cce'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'target'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '54af34cc844945e1960772da64a7a1df'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '54b67265bcd94cba94091c47f4005507'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'approval_ref'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '54c0782cac65433383d39ff794d392df'
                        key: {
                            sys_security_acl: 'b3d719e965744394a2571dc55768fdb0'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '54c2cbaee35a4bf9a1dfe4089485184e'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '54c4de592eff476f9ce9063b230c2a51'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'qty'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '54e01cccbd40485ab980044bd9dc24ce'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'queued'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '554a8deb6bfc464990ebf863942876b8'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '55814b2d4d0043ae823ecbf8e56eb625'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '55b0567e515e4cf7b5a8e9dc085d331e'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '55d4297b82064cffb6f018cb59fadb00'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '55ef7a10b9a14bf38a050f97111d97c1'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_object_map'
                            col_name_string: 'erp_system,logical_object,operation,country'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '560b1e98c6f74699a822fe0117e26412'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'issue_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '564f110a8b0f459d8e8d9a8b6a301ed1'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '566522cc854a46be80f4c861232a9795'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5673559641bf454d9f2cd5907bb2f747'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '569bab31568b4d01a826356610d001e5'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '56b42f67837d4dbb89940e4bc6f9c17c'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                            value: 'not_applicable'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '570997c7e0204067b83191ead71090ea'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_verified'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '572d4dfa08784ef4b1e5f14b570b111e'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '57ad50026b824d2a89910213ac9184d4'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '57f3c43b71b54819b88789c74412dc92'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'native_timesheet_workflow'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5846286caa9540ed98405c296337f7dc'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '584eb17310ad412d907d17a93b9fda32'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '589286a311674d99bc9ebef6cb10b069'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '58a456b782d44a78a71eb01a938f9297'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '58cb027389644daa8ec62f9b919db3b0'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'line_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '591ca641caaa4c069d3449e9bcf5e014'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'completed_by'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '59243234ab7547a5adb69bbc8d45b6f1'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '593de432021a4ee0829b2b3b897da283'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5a265418aa8f4a39b88d23bbf4681d0a'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                            element: 'probe_protected'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5a750a7b1f274aec9bb70e1ae1451be6'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'object_map'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5ac178db2ba54d4cbce040ed77ac7f90'
                        key: {
                            sys_security_acl: '40472c38b67d4d83820e7373236b0905'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5af5be79c437449e97a9c235cfbf9587'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            value: 'oauth2_client_credentials'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5b4759534250408bbebb0126673ec5fd'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'pages_fetched'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5b729616838b4c0095e2a513989c8e54'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5bda2c9c8745419d8b14d4cb71061fdb'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '5bde5948b055473b829c88965146d96c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5c31add4bb9a4ba4a8fd06d64337b084'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'dim'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5c7c8cb945c64758a6d21da51c5316d9'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'severity'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5c93d38e8d2046b7be07f51fc614e39b'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D1'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5cff0de53879417d9b2b06a3229861b9'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'period_label'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5d1effa7184c4be6adf469a10e639ce6'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'started'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5d672625e2054fed83deb94253575af6'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5dda65394a774514ae944aca727e3942'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5de7cfe670394cc999520d096f78b965'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_exception_ref'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5e4e4c5f434b43a1bbef59227d7c60cd'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'action'
                            value: 'submit'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5e7840a415b94a1eb606d891f40b96e9'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5e8b1e62c8ef443b9f95fa479ebba604'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'required_objects'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5e8fa8bb9ebd4cbda386033b0e8eb527'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5ee50519dc9e4e69bf3e59e0ba3b45df'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5eef4d1e75cc4ec2beb596d293421319'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_source'
                            value: 'template'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5ef6484ba0014e27837b50e5a67b048e'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R10'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5efaae643a3545249e8e6a259267e908'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'period_start'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5efdaebe32504917a0f114978d3088ee'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'day'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5eff137d3cbd41ff8e37d4c1d108df94'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'sap_s4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5f29637f24a14f009dfc3cf539b350ee'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5f88e5d0d3f34f6ba30a7a5f468c9036'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '600309f684174a9f98cb8600c4313d3a'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                            value: 'rejected'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '60373bbcc28c4cae971dda740738b5c9'
                        key: {
                            sys_security_acl: 'a2acf949a6674128ab15f28b25c891a6'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '605264219433412eb14465778251008f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            value: 'cursor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6067e5cae49441fa8722df6330f3d20a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'circuit_open_until'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '607f50713e9e4735a1985032239aeb69'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'backoff_ms'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '60db8ceb1a744ccebb1de169c4091e67'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_header_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '610b6ae81a5b4224906ed671e2804ef1'
                        key: {
                            sys_security_acl: '176ba1924d1348a0b3cfb85a3a6f49a5'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '610e44bfb921496facb34e849730d5ca'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            value: 'page'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6156a052e93343798e980d09ab2c4417'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '61a5e10c7bd54f5f9c6161411c34cb5c'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'number'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '6256f69481a94018af8136a0d8fc7d24'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_emp_xref'
                            col_name_string: 'erp_system,erp_employee_key'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '628eb84112c048e6a6bef056ed2b7a43'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R5'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '62ffb5f521c04ff78549fd19d7bc2784'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '63523a4e6ec14dbc9daf8e5a0747746e'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'pay_date'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '63ec33228d8f42e98b19ac9bed15ca60'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            value: 'oauth2_jwt'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '64302838d8c74b25b9752c69cc5d6380'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'subject_employee'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '64eab88e566246538f2cdfe10ecf6e47'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '65b1fc6128554114b17accacf3133a12'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'opened_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '65d27a0c729c418fabb13dcd8a1ea780'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'rows_returned'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '66bdaaf8ce544737a41231e0dfc8f09a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '67158ea2231e4344a3f951ab61ead505'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '677f28f5ad194f208a534171c4765952'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R7'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '678645ebe8b3404f95182a25cc40462e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'first_sent_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '678b8473c4c441e893a43f696c2d2647'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '67b784b63c1a4e59a147f4e8c3d674b1'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'claim_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '67d02ebc1e5e4f64be1f5b588b6d403e'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'occurred'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '67dbe11a2ec1446e812e2a9e0ac96bf7'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'source_record_id'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '68007a3fc5f74b949664acf7aec3a7b4'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '683257e4ccec40619af5308bcac00b3f'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6938551860364ba68d2b786f4619f19f'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '69609406208546dbb03c27f933c4c368'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'label'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '69908a125c2d4fe3bf74ef51b44a1c61'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                            value: 'separate_hcm'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '69af664ceb63425d880aeade54afeaf9'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '69c3e12cb30f42a8b642fc4c72f4940c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'employee_id'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6a1ff3823c824a9496291a9d3b36e7ac'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'safety_stock'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6a46557294cb4b0e82914ac36a4b2755'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'operation'
                            value: 'update'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6a732c125de6491e9438b0d0f09d4813'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'persona_role'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6a9f4b79229f420fa77eaefe940057eb'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'plan_option'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6b104571bd8e457498321e3b2eba3ef0'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6b8518271c634ee1a32a5a01e042d0ed'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6b8d2b7fe3c14c49b3d8c12858b00314'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6b903296961d457eb42ec7ccef91437c'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '6ba06f926514432897c06d08d02f33a4'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_erp_system'
                            col_name_string: 'name'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6bd62ebaae51451c961ad0c45ccc59be'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6c0463e1728c4f0bbf0aa778a93d9cab'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6c33959340b2410bbd4988c5495ea4a0'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'requester'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6c351e8776924ff391a1d310fa8ac867'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6c95145a70ca4d3bb70d74bdfd74dcd9'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '6cbf25cca54b4c949cb540f0189c1a34'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_staging'
                            col_name_string: 'sync_run'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6cfeef1be2924370ab69405625bba4ab'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'occurred_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6d98913526e8483cbfe9cc51a3d7fbb3'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6dce9f006301430aa64227dc7d627a26'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'status'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6e061288f2a74705bd2d3189720aad54'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6e81e4d3242d4cf4a4abcd6c246110e6'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6eb2de2f9a2d46fab4f0325fe217746d'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6eed244f750542158391c4ff1fd6660e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'state'
                            value: 'open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6ef42be241e1459997c40d4cd51c904f'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'payroll_country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6f636305c29a4b19927da25a5adadf7f'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'drained'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6f6876df07d44f258459bb8caecd7fb5'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6fa5014f10594ae2b68b58884204e585'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D7'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6fba7f823fa447ba90b5258d0448e5b5'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'parent_external_id'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '6fc0d1f9c25f48778d313372dca9570b'
                        key: {
                            application_file: '89336782e4924a5bbf1f126fde0e6383'
                            source_artifact: 'a398b98e6d5d4b62b91bf1e742f977ab'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6fdfed4e8d17473493463abe88558a89'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'finished'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '70712c89efda402fba2382cb61e5a9c9'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '70b45ea8ccb0413c84f90d2a5b0a5920'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'error'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '70decded3ef24c2cae15cf4d315045ec'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R5'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '70ea4ec89d1c4a9d857ac9a009c9581c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'mid_server'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '70f79be3faba4075bb2f3b1bc3a1477a'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '70ffa015e27f488f8d1337648fd4cd67'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '71e55ca7e3fe4a229ffb0c91b90f63c5'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_emp_xref'
                            col_name_string: 'user,erp_system'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '723af5c118c24f41a253bc98f920e704'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'field_map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7251ac0e56484167836de5f93a263d52'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '728a60b5434848798e3657e46d5b1d6c'
                        key: {
                            application_file: '3c73b091aada42238d9e1b6667c1f690'
                            source_artifact: 'a398b98e6d5d4b62b91bf1e742f977ab'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7296270bd4ba4e4fadd4448d3d08335c'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'currency_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '72f092ad5eeb46b4af36b2a2960ef983'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '733a42e56bc64d50b5426e73fc6fd950'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'started_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '734ba9efb40a4d56b7c867b71517f543'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'optional_defaults'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '73961035a13c412aaf70e2aba37b9c5e'
                        key: {
                            sys_security_acl: '6d91874773fb4e5c9661b69f7a4f36a8'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '73dbf15a5c6145df8cc8fe16b83f146a'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'failure_reason'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '73e7404ababc45a8b03b0f9bd325629e'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '73e853671329471a881bbde9ced2e7ab'
                        key: {
                            sys_security_acl: 'a788952a37c6490099b0e959f1c839bf'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '74009598c1154954823a0b8481a803f2'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'pay_period_label'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '74092b8456ec43879bea8fd2b4781b81'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7483ba03a55344bd812eb7139977e0ae'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '74c6c3005543446b9a99f9f838e2a078'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '74fa5ca0326241bc883f7cc2be5fa3d5'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'operation'
                            value: 'read'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '755264c0315e4d449e8905c0d359b9ed'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'uploaded_by'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7558a0c0dada4efa8c4e83a3e99e8531'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'blocked_readonly'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '757fc49b505446e18ca08a96b273ed0c'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '758fc247b3bd4e768cc5a17873c0e54b'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R9'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '75c6a004aef2428b82fd5dd563f034f4'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7607e35efef84cb7bad841eb492759fb'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '762c5a4552ed434d8cf345f5b07a27af'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'identity_mismatch'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '762cb96f38744ab98ad2fc1cc1b89013'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '76615979f2574cae8243969c09518e1c'
                        key: {
                            name: 'x_335329_sn_hr_erp.finance_viewer'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '76c5ba0722fa491788b965e30ba21271'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '76daf69dc6584de4993247986df37cd5'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sc_cat_item_category'
                        id: '7700a2659119494baa9de2a2a61bca4f'
                        key: {
                            sc_cat_item: '84ed5f41094747f58577f2e76d1d9bf1'
                            sc_category: '3eeeb63c71e1495aaab1fd597b597ccc'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '7700f32721364479b2f6d1441076b64f'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '776b505e0b5647d1929e7abc8b229afb'
                        key: {
                            sys_security_acl: 'f5984c87ba41480787163503cdf33bfb'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7780877fec0441378c5bc67dc01c49d6'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'api_version'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '778406abbe5048ef90d94f31f5e75692'
                        key: {
                            sys_security_acl: '3a06a3f1ea914c79bc4c4b58d67ca60a'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '778c18ae11704ee9a9af24236a48b904'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '77a9160373bb4dd6a86afe64a160085f'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '77ab822c8f744c6fa0dfc198baf4d3cb'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '77ada6e6fcc940fca9e519e5b700624c'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '782b10b4266947de8e7f601f97ed7bed'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '78634bd6c67b40ef87b33c49a8389129'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'requester'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '786decbfe74041cda9af3c2419fa188b'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '78a2ab4b121c48eaa312141261981579'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7912ff914c0140ab9ffbf36f47a7845f'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7927e8dea76944cdb29987e5e64f900f'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'required_fields_override'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '796a8d3448ef41fb8f4d4aadd8ab9f8b'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'http_code'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '797a3c01dd4846b59d501c8e2ea75f6c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'rate_limit_per_min'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7989e30603c64cfcb872a432386682fb'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'statutory_contributions'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '79e0afaa6b6d4c069f947253da088e5a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'document_type_category'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7a0b9fbe8a1043f0ab72f983cfecd7a7'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'started'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '7a0caa7869ff40bb9c8d569c23fa88c2'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7a18e4ae97304658a00dd7b5f03e40c7'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'period_end'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7a4d8fe5bb9b428092beb3b5f5bb40d9'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7a5c674327d44c4e94b97eecd172ed7b'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'version_source_note'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7a877d4eb5454db5b2595e21a4b4297e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'deprecation_policy_url'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7aa16aebc8cd48a2b00c43e15ec672c4'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'rate_limit_safety_pct'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7aa478105cad4e74a6f0b5a5aa062dcf'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'workday'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7ad28c0430204d18a55a818fcf53aa90'
                        key: {
                            sys_security_acl: '7e0f6a3760f7468c81d8a58d66056e7c'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7b6011e193c94b58b50d40f445937ab7'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7b64b916c47c4f31b1d6564d860a6410'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7bb41cbf27db4e3db738b8b1f797f58a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'employment_end_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '7bca34180ed440d0be31e8fbe72e7b1a'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_call_log'
                            col_name_string: 'status,started'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7bd0eb4e18be43008557117a086d0d4a'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'qty'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7bf5bf8eb0db4edf91f99c814f9c1635'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                            value: 'adopted'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7c3a65dd566d42318f89133285f0ec50'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'erp_ack_ref'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7c650bce9af8438bb13ab5afb7b22180'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'linked_by'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '7c703b03237b4f94ac54c0ed66bfab0f'
                        key: {
                            application_file: '419c38383437486984b3726d60b4ddfb'
                            source_artifact: 'a398b98e6d5d4b62b91bf1e742f977ab'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '7c7abe26416e4edbb406c34c2023eb6f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7cbf33d120b040789ad1587b0fdf4394'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'allowed_mime_types'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7cc3376e65d7438c8d0c74f0344047a7'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'pages_fetched'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7cd87b72773c4c79a5348efae4650821'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'requested_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7d0068ac75da4ee6b95198b84867598a'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7db025db77814a13a90def466b3ec661'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'cache_hit'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7dcdb5efc2544d139641904ed4b324db'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                            value: 'existence_check'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7df3ed15e8a64ec497fd9e9e2f152550'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7dff4d6b23304cdaba9c78b587c6de37'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7e38567086a04070a6662377c028ba46'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7f4978342cd240f0aaebc9086a668e3e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'eol_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7f697e362d3f4a7fabf1608c82c0b1b3'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7f730c8c63984f629f1d5804278fb467'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'emergency_contact'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7f7ddd4894cc4ae98bd74d0f2eef185c'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7fc2054ea740407eb4ba0c9eaa7aebb9'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'source_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '800f6cf117364986979923d79fd57388'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'active'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '801a1c2721c647eb9a9798b646d774b4'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D9'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '806047cfa873462cb07265b6b6511c5c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'document_available'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '810a048dbe754acfb38482b3cd5a6284'
                        key: {
                            sys_security_acl: '8490f3800b934818aed5cade7b8d246c'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '814feef27cac40c882673a88afb3e06d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '818c071a91fa4a75acc41ae04289ac43'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'idempotency_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '819cfbaaf19f486c807ec3e558a3c12a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '81cc637f0b3745de8dafa7deacee79dd'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            value: 'offset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '81e93708217647528df0aa865f134991'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '825606c80d7c45a594d53f17252adc11'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '829c5e8498984479a51190f5c990f620'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '82ac6bf4a65443fa9f332800ac54ec18'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_source'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '82b1b403e585427fa5e9f004ccde96ab'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '82c2c54902274887af4ee8db43bea442'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '82cb3c3048eb4ddd97b58bee8f0d969c'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '83041e8daca3476e8b958bbb721c4e29'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'confirmed_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '831af7b527b545278139b49ab9be28fa'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'zero_is_meaningful'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '831bca8f33324f24941cc68719746b5e'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'object_map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8325ecd318604e3f8e06cc444d79ef11'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '833b4fff92024a93a107fead544df43f'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '83881e6efd66496bafce33570ff0acf3'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '841afe2707204efcaf47f2be806a8b7f'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '844f0b23a0fd4debac76008caebd61fa'
                        key: {
                            sys_security_acl: '98423b6b1973492e8f9fc8659a27a6f8'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '846a694e94314bf38faa6a36d99541a2'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'source_field'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '84c4fb25218f4e2ab46e5226f214aa53'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '84f5581a98194f19b23c289b9702699f'
                        key: {
                            sys_security_acl: '6a1021647a0247bf9aa1ecc51cb224d2'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '85214811a386406781cdb04890eeb08a'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '85461c06dc4c41a8aaa552622199a6f0'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            value: 'cursor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '855da24192494f5e9c7779c14e5fce10'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_source'
                            value: 'manual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '85622f357f5a43c3a115c6404684c57b'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                            value: 'procurement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '85cf218ca6b244268375dd892c19ea23'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '86094e5bd1e84876ab7b716536ae5120'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '861fd84e948042bc98069b21ef4bf747'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '86376c876d2f432287a957e7b4340960'
                        key: {
                            sys_security_acl: 'ac617506ca814fbf86577e5e9369516a'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '865d0a3dae274f6096e80eb76716621e'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '8700b11a89e64b728e55c4152ce09925'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '875163d8147a4574bccc6c8814c8211f'
                        key: {
                            name: 'x_335329_sn_hr_erp.admin'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '87a10034fb3f4ac89a32b9ec5c558bd5'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'dynamics_365_fo'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '882909143d3f47968057e3a296f5c12a'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'infor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '88333fc293cc4af99387b9e51a3c42fd'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'query_template'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '888777aa8b5d47a0bf1762c1bc635922'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'allowed_mime_types'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '88981fbb88414fcbb6f2aa3899c6d101'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'required_groups'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '88b8a80673024d42a493d26b83c201ef'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                            value: 'separate_expense'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '88edeb4122cf4f9795c1cf095bd036fb'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'use_mid_server'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '89336782e4924a5bbf1f126fde0e6383'
                        key: {
                            endpoint: 'x_335329_sn_hr_erp_hub.do'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '89a9a19b8b694c88b37d26f4c6b65584'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            value: 'offset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '89ad132d44514a4eb9936d4ecb4fc4a9'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '89f99850abca4b3fb7f2f9047567b13f'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                            value: 'put'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '89fe504f8bea47c2b18120db20b3ac21'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_profile_basic'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '8a617758d9b64f149d01b1d594593d10'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8aa652e8d1814756a8cf2eb23bf97a11'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                            value: 'inventory'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8ab747946a42473d81411db1e0357799'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8af7bca9e1324debb392317ea0c0abd3'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'rows_deleted'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8b4f8904b1d442f6933cb1f40c340857'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            value: 'mutual_tls'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '8b6faa82abf3446288915825fdc61042'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_landscape_discovery'
                            col_name_string: 'erp_system,requirement_area'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8b7587c92515428c877ac1b357ffe48d'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8bcd5e3f22694845aae3c73289e55fd9'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                            value: 'patch'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8c48a0d3c5ee4ce5a55a6d6dd42b9af5'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'cost_centre'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8c761b1e5ec24997b135d8415496657b'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8c85e683831f4b3e8ddcc0431ec638c0'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'required_fields'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8c9997d619634bcfad1eaac58ae7d8a3'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'code'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8cb3466abdff4be2b206daea2762f093'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'customer'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '8cd79d119d1b4b539c9fcfcd2c2e360a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8d6ca6be4c944f158871fbf88cfb4e24'
                        key: {
                            sys_security_acl: 'ef6a0a9428214fac9ec74b1c3ab5a4cf'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8d941f2c8f524afc94caa26b81143ab5'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R10'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8dc3670ed63443a2922ab5101861ca58'
                        key: {
                            sys_security_acl: '688db67b5f3643e0a1596ee3680ad70a'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8dd8aeb7bac34e0ea6122e10c8bb986c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'file_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '8de0958c4ca542089e09a396526bfc9d'
                        key: {
                            category: 'x_335329_sn_hr_erp_doc_req'
                            prefix: 'HRDOC'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8eaff98d07ad4f1b8fb06c2918d2e958'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8ee958847ae241beb4b0ae30bc2ccda1'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8eec7995b8cd46d298cb34be5053e504'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'status'
                            value: 'not_confirmed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8f44afc52cba432783af53b53c652ed7'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '8f59bf22dd2f42a59d046ebc9911e31a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8f69b799cea943a9a903722c8042f137'
                        key: {
                            sys_security_acl: '73e94abeadc34b319a261215a42f6bbd'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8f6fa3d9a7f945ada878d85cc474dac3'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'erp_request_reference'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8f8498f6305b49399343f5fd4cd835e4'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8fade48224c247c7a451870cc60868e7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'deprecation_policy_url'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '906d9f3b18d84f8f8dcb2b67c3ce02a1'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                            value: 'other_system'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '907fd589f1764f9d8513ced51cb071bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'approval_reference'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '908b3958220344739393ce8b5ca9a293'
                        key: {
                            sys_security_acl: '196e338b42cd4399825aa42947f93f01'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '909d6b225b5f477ebdddd9b31845fce6'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'date_format_hint'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '914345dca9c14375993c907081d0fb49'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9145c2ca2ccf492a86215f7420f8744e'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '914bd705f4cb4dfeb439042482e6ecda'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '91f17c5a6a4c40728ffc87e2a4f549fc'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '91fd0d61d89e4a199d5fb5533d8f7cb3'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '92211d1dc29d4fb5a35e27572e12c11b'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'delta'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9258401c12924727a0d315e29b68d595'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9313e165e65e4b198b991143fb9b36ca'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'day_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '937889507ba84f5da408381fd37f3393'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9379967889534df48b1dd08d3fa2ce3c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '93f2223345c14ec2a590f06735c15911'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'started'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9418673f40534f7d97f515f69fd12f6c'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'ratio'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '94a0fa526ba644479d5302ab98a5f99e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '94f1307c58904b6d9d3bd49a0598e6a3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '951c093588f74697978bb05426e72d16'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '951dbe92f18240cbac24589ba1db92ed'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_staging'
                            col_name_string: 'erp_system,logical_object,source_record_id'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '95367f637adc43f29b6e1a74ed912d8f'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'benefit_type'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '958d435faeb043b08250958a8ab17c33'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '95e9e8c55336416f9366cb665ae79485'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'operation'
                            value: 'read'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '95ecd8ebf0b245f9a1277f11431c2c5f'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '964a727171464d03b5feac7342c30d98'
                        key: {
                            sys_security_acl: 'a0b5bb94bb474b22a0c14f01f9e9b20c'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9663bc93292b463eb09561a092a9a61a'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'cache_hit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '968be23c100f48f291b44122fa0abd40'
                        key: {
                            sys_security_acl: 'bf72af756e0b408d95e2db5ed429c2c2'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '96b9bd30551944dc808a5dd7717e78e2'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '96c1bd98bb6c4d91bd729aa30c368e0e'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'requested_at'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '96e92d89deb84328b449da227f01264a'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '96f7e96727e241368afd695dc7a15ecc'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '971c0b8c78f34a6daa1126839acef86c'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'required_fields_override'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '97375617ff5949be85d5189666339fcb'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '974274b661584082a4648e3d7adcb07d'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '979d4d9e9b3d4b219bc191b68206a577'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'entry_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '97a5a83511994c72baa772f8a293d5c1'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '97aedb6cab5b4afb82e9c682cf48248a'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                            element: 'probe_open'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '97bbdcdc4a8e4a498ef9db458127958f'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'template_language'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '982a0e04209249e6967c2c54d5e54b29'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'tax_withheld'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '98a44deeca504f498b8c9e2facf1d1e8'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '991bc431dcca425c8119dfaa07db8d76'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '993008a690bd453f9a0146e3e142035f'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '9a25c6a1431e496e9e5477b577e80f5b'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9a37d8cec59a4fccbf92435876e5fa7d'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                            value: 'adopted'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9ae9b88b2f0642b586a0e2f88f873f2c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9b0eb7b263644477ab0c1f6a95b07d98'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9b146ae7338a4b08be982eae20c368a3'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'reason'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '9b859a3c63374069995a5d280dca3bb1'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_sync_run'
                            col_name_string: 'status,started'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9ba3a17251c94934969e00c34ffab0ad'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9bb7dd207d884e40a5b6d56812ccf5b6'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'http_status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9bba2472378f4f658fc97ffcc1302f6b'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '9c059f05001b475d9f92186340a69e77'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9c1bf733fe014345bb98bdb8f4bffa92'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9c4f6708fac2448b88205fc578334124'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9c83d88a71af4cdd8ab8c9716ac1d315'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9cadd0386fc54d6a8bb831efae58be7c'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9ce0620626634ef39cffea3bd01fe3fc'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'department'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9ceeb37982794b40b6403c8bdbbba317'
                        key: {
                            sys_security_acl: 'b1d4277d5b424115b24710a01f70b213'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9d1b270f304548ba9d44d86d4e58fd7a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'first_sent_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9d3a5cc8eb804e5883cb223ca5334b16'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'build_vs_buy_note'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9d5304f90f29443d8388f7f2afaa45a8'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R1'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9d5c0d98a6e04a5f91bd2badbaa81c05'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9d63b8c754cb448b95e2cba9e37cf1c1'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'external_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9dd4c3c730844080b03f75a3fb360fe4'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'fetched_at'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9dda3b7ee1ff40dc8213f70f13dad10b'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'pay_period'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9e64d9eef3d4475dadcbaa51dce47563'
                        key: {
                            sys_security_acl: 'ace0134fb0b24c74b57faa6bad569f51'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9ed4f5219d264e63a7224b577d4c7a28'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9ed5ab032f684b58a332e0b6517cadcb'
                        key: {
                            sys_security_acl: 'f4cf447c69824207ba4437437af80647'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9ee8eddd14df4f8390284a6e17b10b3a'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9f2fb19981b44283b03a3aaf8859e121'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'unexpected_format'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9f344aab164e4502a243dbfad26afb02'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'generated_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a0190eefd62b420da666aa44105ceaf7'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'placeholders'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a021e24adb7541fc9e283fabd4341f89'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'threshold'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a0817a9cacc244f09c5f3a6af4f11d8c'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a093bbd485694db6960647d5baeb67e0'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'erp_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'a0c8e0980e8543d0bfe94a43f81d9ace'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a1467d1046eb4c9d8375d3fbfd54522d'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a1b31358ce9747a581d3df45a778e8c8'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'occurred_on'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a1c6ad8cf8014aa7899854ba9c415fd5'
                        key: {
                            sys_security_acl: '00f5ae61c4534cb0bb4e279b7c11054b'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a1c90b64ee2f46478124d2edaa1f3daf'
                        key: {
                            sys_security_acl: '90ac9c7e2771442fb521f76f374d2dcc'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a239a739650141d49b071bcb0ae3196a'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a27c12aa70c4489b831bac75ab49cb4e'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'object_map'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a2fb178a84e94044bbec65067a109ccf'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'call_log_ids'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a308ceaedfbf4311994b0cb89687f5de'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a32f620d9afd4884bc26a553aa710acc'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a344bb57327c46e6b2da3d95a9e69868'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'rate_limit_safety_pct'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a3472a3e06ad4d9791d887037d619f91'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                            value: 'finance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'a38a58c2f49d4700b7362718f5c827e9'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'a398b98e6d5d4b62b91bf1e742f977ab'
                        key: {
                            name: 'x_335329_sn_hr_erp_hub.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a408e068727a4c4f8bd2b925aafc2a85'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D8'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a40a5521764641eaba0dca416186f408'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a43ceca6d29749c9a70e02d4de89a53d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'erp_attachment_reference'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a51745927eeb40669c7c30dee803f758'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'timeout_ms'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a54afaaf84a04a45880bdd365b295a42'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'pay_period_label'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a5639b8d2a1642f5a6184b72a14c5622'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a61bd5a042b9449b88003d2770b1d4d0'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a62b93d8fb7448d6ad46f21bf0215790'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'error_message'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a651dd588a6c4814819eab01f283d1ea'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'output_format'
                            value: 'HTML'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a67450209c8b4dde9f97c5eed7e50259'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a6f63ad03a5848b7aa9c2d42d3b5742d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'mandatory'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a6f8ac5cc02c4147ab8425d5a5a6a1e1'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'language'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a78ebbe3fb9d458581cd92e09ebd73cc'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'body'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a80c5ee347354764a87aa3502eef66a9'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a8268d46dfc44bfcab0f02a2410f8dea'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R7'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a82d83cefad54537a8a5167b98373b3a'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a84741d553384ca89df9141dc306a21e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'employment_start_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'a84f0fc3a6404b50b1d70a2408d9d5aa'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            col_name_string: 'vendor,checklist_item'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a84f6a9b593243e5b9b20b771bef393c'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a8c7cea3394f4e6b9c03515747889838'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a8d9385bcbcf465f82f41dc0080636ae'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'native_timesheet_workflow'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a9371122d2344109b7e1c10831bddc1c'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'required_objects'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a93d3535809f404684fb1cb07c83cb56'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'code'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a94932a7b7f24f059b04d20b01cffb92'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'hours'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a99fbf8cd31e44dba457006066addbf7'
                        key: {
                            sys_security_acl: 'a2acf949a6674128ab15f28b25c891a6'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a9b21aec5c76469a853a99c5b9ae9f87'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a9d0728c2bc04519951e4d3835df8328'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'full_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a9ec24a680e54cc58c001a6955665a16'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a9f0f9c9935f4dacaa74799934a05997'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'aac1ccf5132c4355bd2cd3ab974c35f5'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ab4a74c28a234da984f40e7606672fde'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'generic_rest'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ab661b5634bb4874af5dfe1d5c66d15d'
                        key: {
                            sys_security_acl: '2b9282c44c834bdfad0a2f114feadfd4'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'abd4dd26eb524ba582e486cac483d1d0'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'external_ref'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'abe07474e5e042af92ccb40ea19b71b8'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'mapping_verified'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'abebd54b928944de8eac276138c892ef'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'abf3300bdeca4daeb38ace005a92ea02'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'abf623ae4fe3470f8cf201eec11e3365'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'ac45606080944fd18a540f6d39622a11'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ac498da6bf4f4ebe941e5c2ca0d6b4ed'
                        key: {
                            sys_security_acl: 'fbf74a8a628c4a4a8bacb8bb521c9afb'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ac97101d3b7b4826a45dcf0faf8551e8'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'sap_s4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'acb141d8113748bf9211e23d7743f715'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'state'
                            value: 'in_progress'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'acefce70ac7044589fe1bf2ad905f874'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'short_description'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ad3a335a41194fa0914a614612b9415f'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D7'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ad8ee98a8cee4e90b63286f0eb29d2ea'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'income_statement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ad96bcd20e1b4815a0663ad9f8840e4f'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'adeefa0c00cc42ee9483f5a7fd92d67d'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            value: 'odata_skiptop'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ae28fd50845f47feb0d0e6528b5b4d7d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ae2e03cfac8c48f18fa750d1b53aee25'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source'
                            value: 'erp'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ae8f340f60f34555915c46a492040e2e'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'rows_returned'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'aeae3cbafad44fbba02e3873aef5d1f3'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aec52e2ba2e644fb8b9bb402f024f3b9'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'environment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'aed0bff3f3ca4287ab960373de808f42'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'infor'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'af7141d513d940aea4995d06b0be6e0e'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'afa920699be345b29346daaaba163cdc'
                        key: {
                            sys_security_acl: '7189dc044afa49eea57cfe32dccadcfd'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'afb2d79fdeea4d51ad9eb5a682e01804'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'elevated_sensitivity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b04cd4f5ca8f41c68657fee0e2fdf8a0'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R6'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b0938e788a3741d1b3aa1c9ca76b267e'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'label'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b09ab44e229c4b59af6c711df422c9af'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'placeholders'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b11f81b3dd5c4ad0a777d5ca8e97949f'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b13b55dfc764499c90e1e46f2cb1b256'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'rows_upserted'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b14e847985734ad78c25a3d26ac7483a'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b185ed52059e4f16a939c5026440b4cd'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b19f2065dbae4806a235049de1950157'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b1b38c6940d544d59a574a642deaeaeb'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'source_call_ids'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b1d656c5b0804165b62966e06e2251ee'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b1ec8190f74e4cb1a1708a7698862f1d'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'erp_role_or_scope'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b208605bbda84eb1afdaafcfbc69ec94'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'read_only'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b224d6f2b840460daa906254fab7942c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'lower'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b22b6e714bef41e5b04e1bbd23205710'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b233c32175ea4ded885b4c2f8bc9eb9e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b23d4afb1cc9446981ab869427bad39b'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'b2cbc7b561fc4571a521f8da30e1c85d'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b3493bbf50c14d548e415012afae688b'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                            value: 'not_assessed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b3cfc0094c594e38b2c76475e07a1d45'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'completed_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'b3e35831f73243f884ed59aca0a7c989'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b40bfe25c2194559bcf01510b760b48b'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'b46c84b8dd71417580a9b47324b0b0b6'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b46e1cb93aea4bc5ab417806a4cb9d5e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'bank_account_iban'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b48405b2154240f2ad55adcbb080dd58'
                        key: {
                            sys_security_acl: '632b902b39c74e78bd06ef522c3df5f8'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b4ad60a6a4054f389a334b3bc77b5ecf'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'action'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b4bbc43abead45459b0eb4fa90b5e8f7'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b4f5a3de8527433db1433696456bfa99'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b5266d7c61694340bd508d1d2b706292'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'response_root_hint'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b53bed36ffd4441aa21b23ae5cb81677'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'template_language'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b55a02702138406583539e0e3c3dad2c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_profile_oauth'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b683ca5f49c446f691b350bd6630207d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            value: 'oauth2'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b6c765ab89c44bd4872e69b88003444d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'record_not_found'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b6cac094066a432e806d17d0dd92d841'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'timeout_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b6cea8237cbd40a0aae91c9dafff395a'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                            value: 'circuit_open'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b76e5079d80a41f580a9909a1e116826'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b7a3a45887194e14979a40ff9f661c63'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'external_ref'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b7cbfbb1fed54662a46cffa64ad6bbf9'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b7fb743419444d3ea0dc93a4775c53c3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'attempts'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b7fef07302db4f94901b7447dde5f418'
                        key: {
                            sys_security_acl: '50c2b021e8874387a8af77ebac64af72'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b8321ef58f8a450e9d7a2d9aad5c59cb'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b8348ada073441469a86892df6a2c18d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b8486f3a33054b61bb0dab9733d7f09e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'negate'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b881a8b86c6840009eadea5729e0e881'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'country'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b8aa429a25294fd18ffc782e6852c698'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b90bc358fdc54ad5b92173065e7c2a20'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b912965f127643e09da6b3267f3a32e3'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'customer_name'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b914bac9dcff4360ac3b17c5e85c81d4'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'mapping_source'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b93aa74089c14369b999f3937c6c9286'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'oracle_ebs'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b948d94f15a64648993567935f750305'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'verified'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b94a185edf5543beaf2afc6a0946e492'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'b9f76e04eae24093b8b48fb14a219a2d'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'b9f8b8c85897484e9ab02b46e21d691d'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ba5244eb9533407d9386288f5d2dd082'
                        key: {
                            sys_security_acl: 'b99a37a96b7444d7b709c1e7ede3c029'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ba5ab781d7a54d23b7788052aad22c2a'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ba6e99e3665d42f4b0370ac767f381d9'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                            value: 'inventory'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'ba87b6af23dd4b76892000835cb924a6'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_staging'
                            col_name_string: 'erp_category,logical_object,fetched_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'babb6502397f4150b875d81ae8e834ee'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bac8f5b436fe4cba96cb0738c82fc985'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'finished'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'badd8997de0e43daa955495cf6638112'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bb20aea1342241cd88fa66f631c2b4fd'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'erp_category'
                            value: 'procurement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bb81dbf9fb1a47dfb246498aafbcce3e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'ratio_to_percent'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bbd1c9b86bff47db9558d1efbe53b576'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'date_only'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bc0b4366017b4249be09a6cf24c2792c'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D2'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc172cfc264f4ede8ca3784e9c25af8a'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc1a2ad35dcb41f1b8b32731ce30a024'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'bc46eb0430e446f88466786b0fab5416'
                        key: {
                            sys_security_acl: 'c663c7b32998402297187f4b58cf2ac9'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bc4732ea4c09426cbc6dcb5c6079a315'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bc4eae2ebc434de9a3ebc362a323dec2'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bcfbda91d9df42b0ba38d60980517cf1'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'bd0315b291594910837bbd0c4eb8e28e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bd31bc320b584451a874b0e172816fd8'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bd3f449de8a14016b3b753dd9e63e14a'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'bdbdc51053e8454ba2eb33a9af841299'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bdfe386cd6d2499fa9a7335cb2e46b15'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'be17668e570d4d51bad5d12215ee70e8'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'pay_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'be1bcce93f4d438fa61add150e6cbb4e'
                        key: {
                            sys_security_acl: '9ee1ff7b1c244ac689e345593bce2e0e'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'be4652b1407646c8a5fd53dc80d586e0'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'body'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bea77763ff534a5d958cd0aac735357b'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'status'
                            value: 'generated'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'becc956a304145d59d8f87bef99e1363'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'generic_odata'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bf626f9318f0427d84f819634f1e836c'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bf6cdec58bc64655a8cbeb39b2e439cf'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'native_timesheet_workflow'
                            value: 'no'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bf796c499a9f40fe83129c10af31d765'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'code'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c0188d678fb44a88904ff352e31f7b25'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c02af234e42e40c0b72eb2de4e3890cc'
                        key: {
                            sys_security_acl: '6666d9e632d34a8f89edf4ad41a91354'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c08cd24be78c43ba92920a3c7fb50145'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c0a6f6ea61894fd3918a6bbb7b0cc3f8'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'deep_link_path'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c0f011cfd90e4da5a3f14f270b30c558'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'http_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c0fad1caaee94b3daa6a968b50f370f2'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R1'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c1846514ef664a13bda1526417030d65'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c184bd46040645caa67b1e81a440da9e'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'period_start'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c198ab74302b4df695a76b378dcd131c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c1e573cc8ae34d8197ca24fa911fe81c'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'operation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c26562ed8e834713a32b68f057f6d7c4'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c2d2efdd7feb439c8436f0224ee2876b'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c2f40438689442af933bd03f884ba5ef'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'parent_entity_type'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c2fa6fa9dc6848ceaf2809773689389b'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c3107e4370f04b8bbd167f647d11a377'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c3acf09713c34c47b804210bd6576322'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'source_note'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c3ba0d57aead4fe0a6d4cd7ddc6627e1'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'erp_employee_key'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c3d009dfa65f44e9955fb9ecd386e9be'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'c432e42355924141962a7da3aaea7b97'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_staging'
                            col_name_string: 'logical_object,dim'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c441b36d7a3d4152b9cee9380d70670c'
                        key: {
                            sys_security_acl: '5d65bee8864a48e3bc42eea00f0b9dad'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c5233df5abc14cb187c131219758013c'
                        key: {
                            sys_security_acl: 'a0aba4e1ed454b45b201a14108100582'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c538c96da64143a1a885eade30c85e62'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c58beda145a64032a0c574c90311eb33'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c5bfbafea0674823bfb0a1c8d1339d91'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'subject_employee'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c5cec53cc56f486388e085a2b4f44463'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c65997575f294d18a9062d90d17ccf53'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c6618ac2bd474e6db3b11f4ea9bbef09'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D8'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c662d6c96ad44eecb748c81f7928be2e'
                        key: {
                            sys_security_acl: 'f344462c8bb34dc29ccd3d94d36a063b'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c6c2ef6a2f704f169d475e9148587fa4'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'c7b6c03e9fde436c924622ee108d47d5'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_map_tmpl'
                            col_name_string: 'vendor,logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c803d7b6b3bc470caea4e1a706a84c0a'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'expense_claim'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c820d73c258b42cc853deadbd98a7eb1'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R8'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c82489db99824b4e94ced2d1f98498e8'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c853792596bf438f88e1a492708b0d62'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                            element: 'probe_open'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c8807d93bc71447cbcab8a391fce0566'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'phone'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c8f734ced0f543e6bd9533db6a52f938'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'conflict_duplicate'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c91687f0177b4f48b439332137d94d59'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'workday'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'c91b695492634962963af30c031cd917'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c96634f8c1ad4a43860fa74a3f098fa8'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'attempts'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c97213decaad41f5ab6015dc6041b474'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                            value: 'partial'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c9b6381ed5254afb9bee9fe7ec0d9575'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'action'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c9c319b139fa471494653dcb148d1360'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c9d94f205092412d8b9226bd4ed3d01f'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ca3f0c3b9c424bfdaaa3829d6181798d'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'caa71695fea044df80b52d0fa0704d4d'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cad7b3a6a1fe467a96229676ad537448'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                            value: 'get'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'caeb0be58c2b4a94aa39ea5968cc24fa'
                        key: {
                            sys_security_acl: '52a18ca1feb64e5aad25e08011a21b0e'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'caeb98f9c8454b72b0739211d3ebd470'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'label'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cb22083b9d564817be9e307df8598314'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cb2ce41ddd104677ada7e7cad7dc30b3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'call_log_ids'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cb3db5f43c7c4d398c0d583ac29b97ce'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D5'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cb59e0a870a74430a2126930e6aa819c'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'error'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cb8907f284144f419e66d72b7a30d897'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'account'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cbb4f815cc6545199df504235636520d'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'amount'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cbbf002afbbe42e5930183f2d6dada35'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'availability'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'cc26b44fec0b4c54863206575f0d636c'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cc6a816e45eb41dd86c446bd951cc32b'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cce83ee2d00849a68d5d2149d4ac9a13'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'timesheet_entry'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cceebbd121be4b94b32f106928934c5e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'note'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cd14aa82582a4f13b92bbc93e9a9e43c'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'build_vs_buy_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cd38a3b61f5a47539f1c93b66dccf644'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cdae12b65f1441ae8b66be57898dd5bc'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cdf96e0759f6426e908bf72fef20e611'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cece41e374de4c30b3f45891ed37b5e3'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'mime_type'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ced9236a245d42e0b87d45bb25789be6'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                            value: 'manufacturing'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cf3451ef2ef143d182a9a080f8e4caaa'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R8'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cf83511878a24752accec4b233c83cab'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'optional_defaults'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'cf9f57168bd54358834abdf6c950d721'
                        key: {
                            sys_security_acl: '87df98c108a34fd69f839e1609a61752'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cfa491c403c54bd0b1db8b25d43877df'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'linked_on'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'cfab7f6b8eab4aaca70e047491993c68'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_erp_exception'
                            col_name_string: 'state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cffa6e7d08ee44c4b308b6278bedd6b8'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'requested_by'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd0a5272bc63f4080a117eba465d0eec0'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd1080083b84f407a9e0e970a17c83b6b'
                        key: {
                            sys_security_acl: '5b8843f9bbd14170936a3580f6ca4810'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd13da559f7b445f1b051f5f46530d804'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd19b6c79b5f14994a29386e1884d6360'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd1f3206f0ec74b6d87aa1da384b51767'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd2043288c0414dadac05394349446747'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'completed_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd2a44dec8aeb43e8b475f5aa36c44b50'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd2cf42155a5c46fa9cc1ad5a6701cf55'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                            value: 'success'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd2ff53751cde49c5b90b94744eab0fa6'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'identity_mismatch'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd35b9adac1af4a66b6e5c00bb845d0dc'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'supplier_category'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'd37aed8daefd4fc6be7684ac6332ed97'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd3852fd02ac449e1b5f2ee7acfde2685'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd3df0a0ca93144eaa95b4b3e0b733e4c'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd3e9e90f5e1f4804ac8dcb1757fea8f1'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'approved_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd3fb1fc62ee846d4b372723ee9c668f0'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd4378ae870744f5f99917cabdd9c89fd'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'd44a0407107349a3918f6f805db9cef9'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_call_log'
                            col_name_string: 'erp_system,started'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd4b6ed7b91804d64bca78461bdfcc266'
                        key: {
                            sys_security_acl: '38fce3e922b8405ab8a9af9d588f384a'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd4f86ed6e4bc4a5c9d412a3039be1f09'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'approval_required'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'd50d6f9bf9424fd3b28bf6308c0a1065'
                        key: {
                            cat_item: '84ed5f41094747f58577f2e76d1d9bf1'
                            variable_set: 'NULL'
                            name: 'document_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd53ba2ba1d844b459db7d7d85a54787d'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd56433d9142a4d95a12e0b8814367ba9'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'template_country'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd5d5abd7dc0947578f9235dd50bc9bcf'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'authority_system_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd5ecd3cdf0844bdcb824a2a3be159197'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd66a6b06064e4b7db539462cc0a5284b'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'oee_input_scale'
                            value: 'percent_0_100'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd66b0e854fc44cb3947c6ff02bc3461f'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'leave_request'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd6b43c6b9d7d4071b6bbd399f3a4fb65'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd6d430cc4a484bdc90fbc252045e1dfb'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'throughput_source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd6f13a685f584927bd2753044b229ef1'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd6fef236e5d44194bfaba05e06318e67'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'start_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd708c72f72ec46569210bd95a667ec45'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'uploaded_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd711c593822245eea51f97e2291ad12b'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd71f256c0adf454dac00d969dc8978be'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd744661726ba4f92b6fa07d88ef7f86c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'd76826579a80441c98711eff16ddce9c'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'd799a1b3366049b197b906293904e91a'
                        deleted: true
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_object_map'
                            col_name_string: 'erp_system,logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd7cff38386d7477fbd523539b16d0927'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'permission_denied'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd82a1356cdd64cb1956bbe535a308a2e'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'd88c692bf34b42a1bd550d36745acec5'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd8fb6fd5a9c14793af7030f312fa9c8c'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                            value: 'timeout'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd9858c5fb49d424888907d2e8f1563fb'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R9'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'd999a0f87c0f4991baf907a793ea2d6b'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_doc_req'
                            col_name_string: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd99d29fe524d466da6d88c7593efe3ae'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd9ac47f124314b869bca421e7a608e25'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_profile_mutual'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd9e687d8c1c44c5ebbed923bfc579f57'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'hrsd_advanced_integration'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'da0e2ef1c58a4dd6bab143df97b520ec'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                            value: 'mutual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'da4f8a97a45045f79869960fafc0b941'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'daa2fa6b550b42fc87bc6ab577de039b'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'read_only'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dac2a0846b564450a95dca4ab9a28a35'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                            value: 'none'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'db054b06806b4031aba0492ee05ee4ec'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'qty'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'db0cce1a43cd407b9795eb9bafa7f39b'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'contract_type'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'db0ce49249cd4c87bdf7937f1f54c44e'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'db13d0ea3de649ffb90b9406045a25aa'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            value: 'none'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'db202b9548a04d90af584580db0ea24c'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'erp_unavailable'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'db3af34d3a674fb2a11c90c7d8ae20f2'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'currency_code'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'db4e7ce040ac4c25a738c3ada44c575f'
                        key: {
                            sys_security_acl: '3a06a3f1ea914c79bc4c4b58d67ca60a'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dbc5b2d1eb334d218ec8a9e22f0ec584'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dbc696a780494b4387b902ce985f2807'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dbea24ec427542f89b28cfeb6e9bc668'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dc03d1719ef74720aa0b41ce562be039'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'occurred_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dc111448cedd4e8e93294dcbf3a337e6'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'template_country'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dc1970f024114696afc9979f4ec2eb34'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'erp_system'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dca09a83632140419bde8550e3b2bf1b'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'supplier'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dcd529e09f114e9f82b7c3574f39ae6b'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'ordered_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'dce0f607d8fd4552a88c3ddde36d34a6'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dd0b40ba72b5453b912e2e649c8b7685'
                        key: {
                            sys_security_acl: '8113e33f01ad4bc0ba7652f59bc48fe7'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'dda08ad6acb64192b34741b01cf9a97e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dda8973f20f741b297fd2fb6530d61b9'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'operation'
                            value: 'create'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ddc87b03bc6a487caa81136f8bc3d695'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'stock_item'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'de039b75c635494986ea09d1de9f2cfb'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'duration_ms'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'de0c48dd46db4ccaab8c2d91cae0f20f'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'tax_year'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'de119ab0b21a41b9b30e96520717571c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'leave_type'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'de39f8d486f845fd93c3c1db4c599a5b'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D2'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'de5e6b0cdca340e2a9fd253a74b57fa9'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ded9197ec75a4e40ab5d67429620a25a'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'hire_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sc_cat_item_catalog'
                        id: 'df12eee4f26d4f0b851cbe9a6f6e8541'
                        key: {
                            sc_cat_item: '84ed5f41094747f58577f2e76d1d9bf1'
                            sc_catalog: 'e0d08b13c3330100c8b837659bba8fb4'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'df78489dbf2948a3a1b8847fd7760333'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dfea561e9bce49aeba9b9e5fb0757cbf'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'base_url'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e002fa525d814dc984110016b9195cce'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D1'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'e0096e8129354ab0a032a6d37d124142'
                        deleted: true
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_object_map'
                            col_name_string: 'erp_system,logical_object,operation'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e01af8c675b14da49e83e3426d4f1318'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'asset_depreciation'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e05f6264827b42afa6f1b98a2dcc761f'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e06f34afe8dc498097a6f536c5601b65'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                            value: 'blocked_approval'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e08451c29ae14b3587947de1e00e3a19'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'e1105d40818b464e90fdbc295dcbc2ff'
                        deleted: true
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_field_map'
                            col_name_string: 'object_map,logical_field'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e1439216a668473fa6bd566e557929ab'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R3'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'e17a3a90c1fd49d494747c19741e2356'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_erp_write'
                            col_name_string: 'state'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e188aa745df943d8b2dfa56ab7c2b39d'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'R4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e19c28a16ea549c5afbdf13895e46ac1'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e1c3f6254da840268c20fd2ec02d3071'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'assignment_group'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e1cb8163281d4dff82420fbfaf6a7ac1'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e210b2004fa3475289fbd2e434a7d741'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'requisition'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e219f9627ea24c6d9fc7fe12bf47c1b6'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'status'
                            value: 'not_configured'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e24030a9f29e4f9cb991442d2ece2f0f'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                            value: 'not_assessed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e241635523de4b88b9d328791cc998ab'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'mandatory'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e25984fd36a4454f88a1b4f24fe4736c'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e2bf63a59c1340fca013e0cfee38c685'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'e2cd38270dfc42a9b3b06fe8d66448c5'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_sync_request'
                            col_name_string: 'drained,requested_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e2ef673a5f344a959165a62a3bb498e4'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e31b42d2be9442808d93ace205645654'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e36928e2323a47838897f05264ac3d29'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'oee_input_scale'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e37de56a71024c1398b59e65326f2c85'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'terminated'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e3874d95255c4e0d851e6c6077301ef6'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'account_code'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e3a953eaeaf2462ab6d082c261822fa0'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e406659cfe4042b1b813e76154397c71'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'persona_role'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e418ed6f2c1f40bc88861aff18f3e73b'
                        key: {
                            sys_security_acl: '90ac9c7e2771442fb521f76f374d2dcc'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e420db322fd347b599d471fd9c7f8c79'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e45063b47ea84ba2b319e0782ece4c71'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'logical_object'
                            value: 'balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'e4a90033809445dfb4adb83a31bff683'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e4df916f21b14999b57031932ecd1a02'
                        key: {
                            name: 'x_335329_sn_hr_erp_emp_xref'
                            element: 'terminated'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e4fc2d0c927948aaa1223b24873483b6'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                            value: 'rejected'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e53dcf5a98b14258877b77be1c3d777c'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e57b7b22016f464990c5016c2dc66110'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'operation'
                            value: 'create'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e6101b98cad744ca9267bae07bcf1baa'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'payload'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e62666d77e434a7fbcd4295284cb46f7'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e626dc1102654a67b7f942c55e1a56ec'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                            value: 'natural_key'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e6a84821f4b24d07a9c0f522dac62cfc'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'benefit_enrollment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e6eb87a9baf2416fb008969cedaefd7a'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e6ee9178ef25489f9394a55e67390257'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_tmpl'
                            element: 'document_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e7051994139b4ffbb17af0b433ca5bef'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'fixed_asset'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e7310c05403b4dcb83d5c5bbac1db82b'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'object_map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e745a516b37c4903b574d8dba5949a7b'
                        key: {
                            sys_security_acl: '0d91b8680604417eb9e173840e4c8d13'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e781ac20dad849f08bd5d0ee8c89879d'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'e7b0ba044d77414081fa06bfdda0b838'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e7b2887a695c497b936fa4fcdcf05296'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e7dff9f1595b4cad8fc09c39d723789e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'maintenance_schedule'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'e8022e688ba546ddbe18ab1d5b7c8797'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'e8f45bf62a6042ba9d54a167b5fdb1ea'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e92e3cfe65ee489ca76d04cb08044fd9'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'duration_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e946d48935784f8a92244725f8c9fd81'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R2'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e965aca2e3ab43f2a6e66c2a224340ee'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                            value: 'salesforce'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ea94ba169f0a4c039594d61e30a752d8'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'period_end'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eab3f3e4cc0e4a0eaef6349320af2008'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'eae9b8b1a2d14d42b28b481d34f7e3af'
                        key: {
                            sys_security_acl: 'd2e804c5b9754869b6ef0627def6b8ed'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'eaf235d4b97d4faf9b219bd05ec25d6b'
                        key: {
                            sys_security_acl: 'f7cf7692e3064fbbbe0c2f3eea56a19e'
                            sys_user_role: {
                                id: '11031a92b26c4e7ab34910721c4d2504'
                                key: {
                                    name: 'x_335329_sn_hr_erp.viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eafffe9554704e138561b3fbe06eaa01'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'approval_ref'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'eb1ca983956e40a7bfce3fd225c82d90'
                        key: {
                            sys_security_acl: '63ba6abfd7fe4a82851a1ba4e51492ab'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'eb41bd293179416ba3cb896d2ae70092'
                        key: {
                            sys_security_acl: '8e1e1d33b56c4a38a4382301644886bd'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eb8f08ce461147b1a36e37a805875aa7'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'circuit_open_until'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ebc52b5d56da44479048370526cbddc4'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'backoff_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'ebd0f742fb77457a9cfd5ee7fb2ca6e2'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'zero_copy_connector'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ec2f2dbb1dc04752945bfff83e694291'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'effective_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ec6f75be622e40a4a37d78540bd00a38'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ec91b30f8b8a4b8587dac679d9257413'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'status'
                            value: 'confirmed_absent'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ecca18dbf5ef4b39b16bd08101d8466e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'backorder'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ed0f61aaf1f24e81bc91149c8a00554f'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'leave_type_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ed1280d6d64d42619376208078137674'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'generated_on'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ed2657b0a65b4d0f8ac8ebac48277d24'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ed74fff90fe34ee193dbecb8feec73e5'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'pdf_probe_result'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ed768acff3154d88835591d41745dddb'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'oee'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'edabf012ba894a1bbceb91d0f820b659'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_type'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'edd3198af6be4d768724d2747d4664e2'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'eddafdfd9c394d7483c230d08f2c519c'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'production_output'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'edde4d476b504dfd9f9c35af2d19248f'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ede0f512a949483ba0306c5ea797263f'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'R4'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'ede21b8a5d834c689be6b083012527f4'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'idempotency_mode'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ee4d25a9df3d4c2386e8649d11e52529'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ee6c5ca1fc1349c8a9b294868271d5b7'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'line'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eea65450655348f098b52e54b7be30e0'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'optional_fields'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ef28d8f0a7fe44979bc642bc16e8888c'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ef453a799dcb449eadddcb332d870f3a'
                        key: {
                            sys_security_acl: 'b0f8628851744cd397b33177dfe371f9'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'ef7ae16a7e02415cb2b777219ed91345'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_doc_type'
                            col_name_string: 'code'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ef9275c6880543c0a649bed767fdd08d'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ef9595c1dc56419cbd53690ca23377f5'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'base_url'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ef9ac6fef1cb43a791f5525a6c1e5cd0'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'due_on'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'efcfb62238c745b8908f35248ee7daef'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'efd36a087a894fcf9d5d1a8fea8dfd05'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'efdc0369fa5b4875a07606e289476eeb'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'rows_upserted'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f01ffc488be94b57bff0028b617099e3'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f036df9522ed4403ba8589e5a44735a2'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'leave_balance'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f05bca37066646049d9b6d048854dfbe'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f08d1a72e8c349f09776c342cd277d99'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f184b2f486cf443c8d7ab1fa1e1600f9'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'employee_profile'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f186fd45523c46149c4f76c5fb543e7a'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'pagination_style'
                            value: 'next_url'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f19fa0ce3cb74462833a20e97cb5a737'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f1ac86ba2d9d44b0a7741b3e847bdc6c'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            value: 'odata_skiptop'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f1bd36154f89498fb4255a72f50b85f3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f21cbc4fe5aa41c3a06dfe0a6fe3b5b6'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'oee_input_scale'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f2294124d3114f61b60552dcdd21cc4f'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_type'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f243ee480a5c4092b34ceb4b5999eb59'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'required_groups'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f2501468a69e4782a12eb7356a24aeb4'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'operation'
                            value: 'read'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f25a284803304813b9c03aadc582ae21'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'period_end'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f2d91735c0db4fdf98ff861ca8fbf0e1'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'source'
                            value: 'manual'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f309652f8c7146a1ac67e988f189ba31'
                        key: {
                            name: 'x_335329_sn_hr_erp_staging'
                            element: 'erp_category'
                            value: 'procurement'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f35fef6a9c0f41ce9175304b7eec9cac'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'action'
                            value: 'download'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f37a8eecb15546cfb8d62db8610d075a'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'next_period_label'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f3a36e5fbaad44aaaaf1b0b695560d3d'
                        key: {
                            sys_security_acl: '9e52a450098e469a8f1e79a721765410'
                            sys_user_role: {
                                id: '875163d8147a4574bccc6c8814c8211f'
                                key: {
                                    name: 'x_335329_sn_hr_erp.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f47c1fa3ea1a4fd78bcd13ab232f161e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'quality'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f4900ae7db6b4adc982a469cae7cdb1a'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'operation'
                            value: 'update'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f4b9abaf00de4c26986ef3536766c08d'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'requirement_area'
                            value: 'D6'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f57912ccd02346f3baa071a2339b26b9'
                        key: {
                            name: 'x_335329_sn_hr_erp_vendor_onboarding'
                            element: 'status'
                            value: 'confirmed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f57d46c50ad74fbab74216949aa89b34'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'category'
                            value: 'validation_failure'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f5cd8723f19f4c8abae29154f1093348'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'http_method'
                            value: 'post'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f5f0582fbb21497d9f12fe5883911d8f'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'auth_profile_basic'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f62ecaa5fab14a38883f3098fe2bb224'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'attachment_limits_source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f6ea6cc7f93e4f41b02330d643763d45'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'cost_centre_or_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f75da8fca3d449e8b66e83bc5a3b4a01'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f7687adee6684f50a853334fdd6ffac3'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'policy_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f7a38ef2aaf54a0ead67b8d69ce3e3f8'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'date_format_hint'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f7b5e4f3dec74c2095d358eb5ef83e91'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'purchase_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f7c727a20d8b4c2daa1b649c79631776'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'vendor'
                            value: 'netsuite'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f7decd8427784d93b20054befba1a7bd'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'http_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f7ff8471677a4f8dbd93d87b8c146528'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'value'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f82d8eddbe00408ea4a3dc533ebbd679'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'rows_deleted'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f8334318dfec47f2a08c43ef729d06b1'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'submitted_date'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f85043525d204c709008992588aed124'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'environment'
                            value: 'sandbox'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f86d9e67283c44a7b55aa01c1f1f6518'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'logical_object'
                            value: 'payroll_record'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f88f96dda84946e49b2e053591ce7e7b'
                        key: {
                            name: 'x_335329_sn_hr_erp_payroll_calendar'
                            element: 'period_start'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f8c2f29492bb49379e653f67eb3b65db'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f92edbed59d44bddb4a5810304662fbd'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                            element: 'requirement_area'
                            value: 'D10'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f9cafeeb257146edba9f1f40799347b0'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fa3d78c9ff6f4c0e82cee8e49c44a600'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_run'
                            element: 'logical_object'
                            value: 'gl_summary'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'fa69a05135bc4fa49bdb60bdfa48c6e0'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_usage_event'
                            col_name_string: 'outcome'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fa6fc11b849349cfb5f4353ea6840337'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'outcome'
                            value: 'blocked_cutoff'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fa71a5c5878d4043ac1c34b13a45cb80'
                        key: {
                            name: 'x_335329_sn_hr_erp_doc_req'
                            element: 'pdf_probe_result'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fa9a9951865a4785bf246bfc11ace723'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'active'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'fabd7bd098e44c188eabdcb5d1556e5e'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'faf042e4738b4ce5b00435b6e9c22433'
                        key: {
                            name: 'x_335329_sn_hr_erp_sync_request'
                            element: 'erp_category'
                            value: 'manufacturing'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fb5d4afe406b4869aed77051f5b223d5'
                        key: {
                            sys_security_acl: '52a18ca1feb64e5aad25e08011a21b0e'
                            sys_user_role: {
                                id: '0d725b70d93647d1af7c843fa8da56ec'
                                key: {
                                    name: 'x_335329_sn_hr_erp.hr_viewer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fb87ea44a963465ab26cfa8adced0ac9'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'logical_object'
                            value: 'vendor_invoice'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fbb6970234544f628f42df7da4afb7fc'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fbcc8104fb194ff09d210c2df9d49f74'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'call_log_ids'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fbe61d1fe50141619158fc21e03d12ba'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'vendor'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fbe6ac598a6d499f9753fd82b82f4441'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_system'
                            element: 'version_source_note'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fc819c9263f0476889ff8820f66fdc5b'
                        key: {
                            name: 'x_335329_sn_hr_erp_usage_event'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'fcb72739b4b44517bf8a7863b25dfd99'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fcc00ac33d7b49a49f48c465c15e4298'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_write'
                            element: 'logical_object'
                            value: 'compensation_change'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fcd75a395b8b4389b431bb97fb3a6c37'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'erp_claim_reference'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fcf9e626dc4d4c84b8fa695e8098cf15'
                        key: {
                            name: 'x_335329_sn_hr_erp_call_log'
                            element: 'object_map'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fd2644e03c2d4ef6b03066bfedca20ba'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'cost_centre_project_ref'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fd8cfcb40a234dd0a180b702df581825'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'transform'
                            value: 'none'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fdded19d313a4f1d90ddd70b753434f8'
                        key: {
                            name: 'x_335329_sn_hr_erp_scope_grant'
                            element: 'logical_object'
                            value: 'erp_attachment'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fe3f0bf3dc6a4165b304f720381faa2e'
                        key: {
                            name: 'x_335329_sn_hr_erp_erp_exception'
                            element: 'erp_system'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fe56757a7f774790a43b529c45a17062'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'date_format'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'fe63de8a1fc74e62b1a9d66bcdde2642'
                        key: {
                            logical_table_name: 'x_335329_sn_hr_erp_sync_run'
                            col_name_string: 'erp_category,started'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'feb25aa761ff451dba4cc805f6a98ef2'
                        key: {
                            name: 'x_335329_sn_hr_erp_map_tmpl'
                            element: 'pagination_style_hint'
                            value: 'none'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'fed75efcadfe49dc8f1b31dcf28b0275'
                        key: {
                            name: 'x_335329_sn_hr_erp_landscape_discovery'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fef3ae9f437f4ce0adec5578c3d99eb9'
                        deleted: true
                        key: {
                            name: 'x_335329_sn_hr_erp_acltest'
                            element: 'probe_protected'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ff2777e1323f412da757872f3baab19a'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'work_order'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ff40d35074e74149a1022662420ed2e4'
                        key: {
                            name: 'x_335329_sn_hr_erp_object_map'
                            element: 'date_format'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ff92392ba4a84f2693ba951ca1feb634'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_object'
                            value: 'machine_downtime'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ffcb4cfe19df4f12a41af5a9853d1342'
                        key: {
                            name: 'x_335329_sn_hr_erp_field_map'
                            element: 'logical_field'
                            value: 'product'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ffcd431b96a2458dba4cee31f4bc0110'
                        key: {
                            name: 'x_335329_sn_hr_erp_write_approval_policy'
                            element: 'logical_object'
                            value: 'payslip_document'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                ]
            }
        }
    }
}
