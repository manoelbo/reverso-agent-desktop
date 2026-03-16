import{r as a,R as r}from"./iframe-CGsI1KOa.js";import{A as t}from"./AppSidebar-DOm87IUO.js";import{S as n}from"./sidebar-Dg1rAsaG.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./HugeiconsIcon-DwdWuswD.js";import"./AppSidebarCollapsibleMenuItem-rgJBeIT3.js";import"./collapsible-yQzvC5ou.js";import"./index-BIhGhLEQ.js";import"./index-CS3CackO.js";import"./index-ChJJNisk.js";import"./index-KPmvTq_h.js";import"./AppSidebarFooter-7Dw1KlwY.js";import"./AppSidebarHeader-DlLGcFxo.js";import"./button-D8ZgLrYe.js";import"./dropdown-menu-CTWz9yU-.js";import"./index-DLvwGBd6.js";import"./index-Dh7Xx-IF.js";import"./index-BpY4aKqW.js";import"./index-DvcRmy6T.js";import"./index-Dh1u2bSt.js";import"./AppSidebarMenuItem-rq4fhZe4.js";import"./AppSidebarSection-59bxvE2T.js";import"./input-xEBX65vc.js";import"./separator-DBgIsvGZ.js";import"./sheet-CtRDrF8y.js";import"./IconBase.es-Rt6yengf.js";import"./tooltip-EQmfK_gy.js";const p=["sources","leads","findings","allegations","dossier-people","dossier-groups","dossier-places","dossier-timeline","graph-view","model","preferences"],j={title:"blocks/AppSidebar",component:t,args:{activeView:"sources"},argTypes:{activeView:{control:"select",options:p}},parameters:{layout:"fullscreen"}},e={render:({activeView:i})=>{const[o,s]=a.useState(i);return r.createElement(n,{style:{"--sidebar-width":"19rem","--sidebar-top":"0px"}},r.createElement("div",{className:"flex h-screen w-[19rem] bg-background"},r.createElement(t,{activeView:o,onSelectView:s,onSelectDossierFilter:()=>{}})))}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: ({
    activeView
  }) => {
    const [currentView, setCurrentView] = useState<ShellViewId>(activeView);
    return <SidebarProvider style={{
      "--sidebar-width": "19rem",
      "--sidebar-top": "0px"
    } as CSSProperties}>
        <div className="flex h-screen w-[19rem] bg-background">
          <AppSidebar activeView={currentView} onSelectView={setCurrentView} onSelectDossierFilter={() => undefined} />
        </div>
      </SidebarProvider>;
  }
}`,...e.parameters?.docs?.source}}};const q=["Interactive"];export{e as Interactive,q as __namedExportsOrder,j as default};
