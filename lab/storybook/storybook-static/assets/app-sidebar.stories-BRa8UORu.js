import{r as a,R as r}from"./iframe-9S5LuuTj.js";import{A as t}from"./AppSidebar-C7PegPXZ.js";import{S as n}from"./sidebar-DcLV6ivS.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./HugeiconsIcon-CKUv8V2d.js";import"./AppSidebarCollapsibleMenuItem-CWjSnPRU.js";import"./collapsible-CK5BCvhQ.js";import"./index-BErSN80w.js";import"./index-Cco4bJ8O.js";import"./index-DXX1l05D.js";import"./index-BPTpYtnc.js";import"./AppSidebarFooter-CV1Wu_9r.js";import"./AppSidebarHeader-B358l833.js";import"./button-DcnQ_azB.js";import"./index-CpxX1EO1.js";import"./dropdown-menu-B720qdt5.js";import"./index-BjMwMsYB.js";import"./index-BnFamXdT.js";import"./index-afAih3at.js";import"./index-DjjA1Sw3.js";import"./index-BuP_DP2q.js";import"./AppSidebarMenuItem-CIVufQH2.js";import"./AppSidebarSection-BjTO8RQ9.js";import"./input-xEBX65vc.js";import"./separator-CWd6mTkJ.js";import"./sheet-B3SNtlJe.js";import"./IconBase.es-DLv3a65W.js";import"./tooltip-Bg9KXtNn.js";const p=["sources","leads","findings","allegations","dossier-people","dossier-groups","dossier-places","dossier-timeline","graph-view","model","preferences"],q={title:"blocks/AppSidebar",component:t,args:{activeView:"sources"},argTypes:{activeView:{control:"select",options:p}},parameters:{layout:"fullscreen"}},e={render:({activeView:i})=>{const[o,s]=a.useState(i);return r.createElement(n,{style:{"--sidebar-width":"19rem","--sidebar-top":"0px"}},r.createElement("div",{className:"flex h-screen w-[19rem] bg-background"},r.createElement(t,{activeView:o,onSelectView:s,onSelectDossierFilter:()=>{}})))}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...e.parameters?.docs?.source}}};const z=["Interactive"];export{e as Interactive,z as __namedExportsOrder,q as default};
