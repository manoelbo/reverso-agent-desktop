import{R as e}from"./iframe-CGsI1KOa.js";import{H as m,N as d,d as N,D as h}from"./HugeiconsIcon-DwdWuswD.js";import{A as c}from"./AppSidebarCollapsibleMenuItem-rgJBeIT3.js";import{B as I}from"./badge-1BWgh9Ue.js";import{C as p,a as u,b}from"./collapsible-yQzvC5ou.js";import{a as S,b as f,c as g,d as C,e as E,S as w,f as x,g as M}from"./sidebar-Dg1rAsaG.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./button-D8ZgLrYe.js";import"./index-ChJJNisk.js";import"./index-BIhGhLEQ.js";import"./index-CS3CackO.js";import"./index-KPmvTq_h.js";import"./input-xEBX65vc.js";import"./separator-DBgIsvGZ.js";import"./sheet-CtRDrF8y.js";import"./IconBase.es-Rt6yengf.js";import"./index-Dh7Xx-IF.js";import"./index-BpY4aKqW.js";import"./index-DvcRmy6T.js";import"./tooltip-EQmfK_gy.js";import"./index-Dh1u2bSt.js";const v={id:"dossier-people",label:"People",files:["andre-santos.md","ana-de-fatima-alves-ruivo.md"]},k={id:"dossier-places",label:"Places",subfolders:[{name:"Brasil",subfolders:[{name:"São Paulo",files:["rua-pedro-messias.md","av-regente-feijo-944.md"]}]}]},X={title:"blocks/sidebar/AppSidebarCollapsibleMenuItem",component:c,parameters:{layout:"fullscreen"}};function n({children:a}){return e.createElement(w,null,e.createElement("div",{className:"h-screen w-[320px] bg-background"},e.createElement(x,{collapsible:"none"},e.createElement(M,{className:"px-2 py-3"},a))))}const t={render:()=>e.createElement(n,null,e.createElement(c,{section:v,activeView:"dossier-people",onSelectView:()=>{},onSelectDossierFilter:()=>{}}))},r={render:()=>e.createElement(n,null,e.createElement(c,{section:k,activeView:"dossier-places",onSelectView:()=>{},onSelectDossierFilter:()=>{}}))},s={render:()=>e.createElement(n,null,e.createElement(p,{defaultOpen:!0,className:"group/collapsible"},e.createElement(S,null,e.createElement(u,{asChild:!0},e.createElement(f,{type:"button",isActive:!0},e.createElement(m,{icon:d,size:14,strokeWidth:1.8,className:"shrink-0 transition-transform group-data-[state=open]/collapsible:hidden"}),e.createElement(m,{icon:N,size:14,strokeWidth:1.8,className:"hidden shrink-0 transition-transform group-data-[state=open]/collapsible:block"}),e.createElement(m,{icon:h,size:16,strokeWidth:1.8}),e.createElement("span",{className:"min-w-0 flex-1 truncate"},"People"),e.createElement(I,{variant:"secondary",className:"h-4 px-1.5 text-[10px]"},"24"))),e.createElement(b,null,e.createElement(g,{className:"gap-0 py-0"},["andre-santos.md","ana-de-fatima.md","milena-borges.md"].map(a=>e.createElement(C,{key:a},e.createElement(E,{asChild:!0,className:"h-6 w-full min-w-0 text-xs"},e.createElement("button",{type:"button",className:"w-full text-left py-0"},e.createElement("span",{className:"truncate"},a))))))))))},l={render:()=>e.createElement(n,null,e.createElement(p,{defaultOpen:!1,className:"group/collapsible"},e.createElement(S,null,e.createElement(u,{asChild:!0},e.createElement(f,{type:"button",size:"sm"},e.createElement(m,{icon:d,size:12,strokeWidth:2,className:"shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"}),e.createElement("span",{className:"min-w-0 flex-1 truncate text-xs uppercase tracking-[0.16em]"},"Timeline"))),e.createElement(b,null,e.createElement(g,{className:"gap-0 py-0"},["2023-12.md","2023-11.md","2023-10.md"].map(a=>e.createElement(C,{key:a},e.createElement(E,{asChild:!0,className:"h-6 w-full min-w-0 text-xs"},e.createElement("button",{type:"button",className:"w-full text-left py-0"},e.createElement("span",{className:"truncate"},a))))))))))},o={render:()=>e.createElement(n,null,e.createElement(c,{section:{id:"dossier-places",label:"Places",subfolders:[{name:"Brasil",subfolders:[{name:"São Paulo",subfolders:[{name:"Aricanduva",files:["rua-da-meacao-197.md","av-regente-feijo-944.md"]}]}]}]},activeView:"dossier-places",onSelectView:()=>{},onSelectDossierFilter:()=>{}}))},i=t;t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <ItemFrame>
      <AppSidebarCollapsibleMenuItem section={dossierPeople} activeView="dossier-people" onSelectView={() => undefined} onSelectDossierFilter={() => undefined} />
    </ItemFrame>
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <ItemFrame>
      <AppSidebarCollapsibleMenuItem section={dossierPlaces} activeView="dossier-places" onSelectView={() => undefined} onSelectDossierFilter={() => undefined} />
    </ItemFrame>
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <ItemFrame>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton type="button" isActive>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} className="shrink-0 transition-transform group-data-[state=open]/collapsible:hidden" />
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} className="hidden shrink-0 transition-transform group-data-[state=open]/collapsible:block" />
              <HugeiconsIcon icon={Folder01Icon} size={16} strokeWidth={1.8} />
              <span className="min-w-0 flex-1 truncate">People</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                24
              </Badge>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="gap-0 py-0">
              {["andre-santos.md", "ana-de-fatima.md", "milena-borges.md"].map(file => <SidebarMenuSubItem key={file}>
                  <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
                    <button type="button" className="w-full text-left py-0">
                      <span className="truncate">{file}</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </ItemFrame>
}`,...s.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <ItemFrame>
      <Collapsible defaultOpen={false} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton type="button" size="sm">
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2} className="shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              <span className="min-w-0 flex-1 truncate text-xs uppercase tracking-[0.16em]">Timeline</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="gap-0 py-0">
              {["2023-12.md", "2023-11.md", "2023-10.md"].map(file => <SidebarMenuSubItem key={file}>
                  <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
                    <button type="button" className="w-full text-left py-0">
                      <span className="truncate">{file}</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </ItemFrame>
}`,...l.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <ItemFrame>
      <AppSidebarCollapsibleMenuItem section={{
      id: "dossier-places",
      label: "Places",
      subfolders: [{
        name: "Brasil",
        subfolders: [{
          name: "São Paulo",
          subfolders: [{
            name: "Aricanduva",
            files: ["rua-da-meacao-197.md", "av-regente-feijo-944.md"]
          }]
        }]
      }]
    }} activeView="dossier-places" onSelectView={() => undefined} onSelectDossierFilter={() => undefined} />
    </ItemFrame>
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"Variant1CurrentFiles",...i.parameters?.docs?.source}}};const Y=["Variant1CurrentFiles","Variant2NestedFolders","Variant3WithBadge","Variant4Compact","Variant5DeepTree","Default"];export{i as Default,t as Variant1CurrentFiles,r as Variant2NestedFolders,s as Variant3WithBadge,l as Variant4Compact,o as Variant5DeepTree,Y as __namedExportsOrder,X as default};
