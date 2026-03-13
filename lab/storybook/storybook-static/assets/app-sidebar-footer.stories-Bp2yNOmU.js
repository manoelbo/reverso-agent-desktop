import{R as e}from"./iframe-9S5LuuTj.js";import{H as m,N as f,v as p,a as g}from"./HugeiconsIcon-CKUv8V2d.js";import{A as u}from"./AppSidebarFooter-CV1Wu_9r.js";import{A as b,a as v}from"./avatar-bQFYfFkK.js";import{B as c}from"./badge-D0lAi6qL.js";import{B as l}from"./button-DcnQ_azB.js";import{D as E,a as N,b as w,c as M,d as F,e as d}from"./dropdown-menu-B720qdt5.js";import{S as D,f as y}from"./sidebar-DcLV6ivS.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./index-BErSN80w.js";import"./index-Cco4bJ8O.js";import"./index-DXX1l05D.js";import"./index-afAih3at.js";import"./index-CpxX1EO1.js";import"./index-BPTpYtnc.js";import"./index-BjMwMsYB.js";import"./index-BnFamXdT.js";import"./index-DjjA1Sw3.js";import"./index-BuP_DP2q.js";import"./input-xEBX65vc.js";import"./separator-CWd6mTkJ.js";import"./sheet-B3SNtlJe.js";import"./IconBase.es-DLv3a65W.js";import"./tooltip-Bg9KXtNn.js";const X={title:"blocks/sidebar/AppSidebarFooter",component:u,parameters:{layout:"fullscreen"}};function r({children:x}){return e.createElement(D,null,e.createElement("div",{className:"h-screen w-[320px] bg-background"},e.createElement(y,{collapsible:"none"},e.createElement("div",{className:"flex-1"}),x)))}const t={render:()=>e.createElement(r,null,e.createElement(u,null))},a={render:()=>e.createElement(r,null,e.createElement("footer",{className:"space-y-2 border-t border-sidebar-border/60 p-3"},e.createElement("div",{className:"flex items-center justify-between"},e.createElement("span",{className:"text-xs text-muted-foreground"},"Model"),e.createElement(c,{variant:"outline",className:"h-4 px-1.5 text-[10px]"},"gemini-3")),e.createElement("div",{className:"flex items-center justify-between"},e.createElement("span",{className:"text-xs text-muted-foreground"},"Credit"),e.createElement(c,{variant:"secondary",className:"h-4 px-1.5 text-[10px]"},"$30,00"))))},n={render:()=>e.createElement(r,null,e.createElement("footer",{className:"border-t border-sidebar-border/60 p-3"},e.createElement(E,null,e.createElement(N,{asChild:!0},e.createElement("button",{type:"button",className:"flex w-full items-center gap-2 rounded-md border border-sidebar-border/60 px-2 py-2 text-left hover:bg-sidebar-accent"},e.createElement(b,{size:"sm"},e.createElement(v,null,"MB")),e.createElement("div",{className:"min-w-0 flex-1"},e.createElement("p",{className:"truncate text-xs font-medium text-sidebar-foreground"},"Mane Brasil"),e.createElement("p",{className:"truncate text-[11px] text-muted-foreground"},"Investigador")),e.createElement(m,{icon:f,size:14,strokeWidth:1.8}))),e.createElement(w,{align:"end"},e.createElement(M,null,"Workspace"),e.createElement(F,null),e.createElement(d,null,"Configurações"),e.createElement(d,null,"Trocar modelo")))))},o={render:()=>e.createElement(r,null,e.createElement("footer",{className:"space-y-2 border-t border-sidebar-border/60 p-3"},e.createElement("div",{className:"flex items-center gap-2 text-xs text-muted-foreground"},e.createElement(m,{icon:p,size:14,strokeWidth:1.8}),"Mode: Agent"),e.createElement("div",{className:"grid grid-cols-2 gap-2"},e.createElement(l,{size:"xs",variant:"outline"},"Model"),e.createElement(l,{size:"xs",variant:"ghost"},"Billing"))))},s={render:()=>e.createElement(r,null,e.createElement("footer",{className:" p-3"},e.createElement("div",{className:"space-y-1.5 text-[11px] text-muted-foreground"},e.createElement("div",{className:"flex items-center justify-between"},e.createElement("span",{className:"inline-flex items-center gap-1"},e.createElement(m,{icon:p,size:12,strokeWidth:2}),"Model"),e.createElement("span",null,"gemini-3-flash-preview")),e.createElement("div",{className:"flex items-center justify-between"},e.createElement("span",{className:"inline-flex items-center gap-1"},e.createElement(m,{icon:g,size:12,strokeWidth:2}),"Credit"),e.createElement("span",null,"$30,00")))))},i=t;t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <FooterFrame>
      <AppSidebarFooter />
    </FooterFrame>
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <FooterFrame>
      <footer className="space-y-2 border-t border-sidebar-border/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Model</span>
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            gemini-3
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Credit</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            $30,00
          </Badge>
        </div>
      </footer>
    </FooterFrame>
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <FooterFrame>
      <footer className="border-t border-sidebar-border/60 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex w-full items-center gap-2 rounded-md border border-sidebar-border/60 px-2 py-2 text-left hover:bg-sidebar-accent">
              <Avatar size="sm">
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-sidebar-foreground">Mane Brasil</p>
                <p className="truncate text-[11px] text-muted-foreground">Investigador</p>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Trocar modelo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </FooterFrame>
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <FooterFrame>
      <footer className="space-y-2 border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={RoboticIcon} size={14} strokeWidth={1.8} />
          Mode: Agent
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="xs" variant="outline">
            Model
          </Button>
          <Button size="xs" variant="ghost">
            Billing
          </Button>
        </div>
      </footer>
    </FooterFrame>
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <FooterFrame>
      <footer className=" p-3">
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={RoboticIcon} size={12} strokeWidth={2} />
              Model
            </span>
            <span>gemini-3-flash-preview</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={CoinsDollarIcon} size={12} strokeWidth={2} />
              Credit
            </span>
            <span>$30,00</span>
          </div>
        </div>
      </footer>
    </FooterFrame>
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"Variant1Current",...i.parameters?.docs?.source}}};const Y=["Variant1Current","Variant2Badges","Variant3ProfileMenu","Variant4Actions","Variant5SystemStatus","Default"];export{i as Default,t as Variant1Current,a as Variant2Badges,n as Variant3ProfileMenu,o as Variant4Actions,s as Variant5SystemStatus,Y as __namedExportsOrder,X as default};
