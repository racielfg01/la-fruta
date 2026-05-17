# Graph Report - .  (2026-05-17)

## Corpus Check
- Corpus is ~37,595 words - fits in a single context window. You may not need a graph.

## Summary
- 673 nodes · 1479 edges · 81 communities (37 shown, 44 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.86)
- Token cost: 60,500 input · 4,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Pages|Admin Pages]]
- [[_COMMUNITY_App Pages|App Pages]]
- [[_COMMUNITY_UI Navigation & Display|UI Navigation & Display]]
- [[_COMMUNITY_UI Layout & Shell|UI Layout & Shell]]
- [[_COMMUNITY_Auth Actions|Auth Actions]]
- [[_COMMUNITY_Toast System|Toast System]]
- [[_COMMUNITY_Admin Navigation|Admin Navigation]]
- [[_COMMUNITY_Admin Business Pages|Admin Business Pages]]
- [[_COMMUNITY_Menubar|Menubar]]
- [[_COMMUNITY_Context Menu|Context Menu]]
- [[_COMMUNITY_Dropdown Menu|Dropdown Menu]]
- [[_COMMUNITY_Carousel|Carousel]]
- [[_COMMUNITY_Item Component|Item Component]]
- [[_COMMUNITY_Calendar & Pagination|Calendar & Pagination]]
- [[_COMMUNITY_Form Component|Form Component]]
- [[_COMMUNITY_Drawer|Drawer]]
- [[_COMMUNITY_Chart Component|Chart Component]]
- [[_COMMUNITY_Core App Architecture|Core App Architecture]]
- [[_COMMUNITY_Input Group|Input Group]]
- [[_COMMUNITY_Empty State|Empty State]]
- [[_COMMUNITY_Toggle Group|Toggle Group]]
- [[_COMMUNITY_Base UI Primitives|Base UI Primitives]]
- [[_COMMUNITY_Auth Pages|Auth Pages]]
- [[_COMMUNITY_Accordion|Accordion]]
- [[_COMMUNITY_Popover|Popover]]
- [[_COMMUNITY_Alert|Alert]]
- [[_COMMUNITY_Store Pages|Store Pages]]
- [[_COMMUNITY_Resizable|Resizable]]
- [[_COMMUNITY_Button Variants|Button Variants]]
- [[_COMMUNITY_App Icons|App Icons]]
- [[_COMMUNITY_Auth Layout|Auth Layout]]
- [[_COMMUNITY_Input & Textarea|Input & Textarea]]
- [[_COMMUNITY_Field & Form|Field & Form]]
- [[_COMMUNITY_Root Layout & Auth|Root Layout & Auth]]
- [[_COMMUNITY_Next Config|Next Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Command & Dialog|Command & Dialog]]
- [[_COMMUNITY_Badge & Nav Menu|Badge & Nav Menu]]
- [[_COMMUNITY_Popover & Tooltip|Popover & Tooltip]]
- [[_COMMUNITY_Item & Separator|Item & Separator]]
- [[_COMMUNITY_Context & Dropdown|Context & Dropdown]]
- [[_COMMUNITY_Toast & Toaster|Toast & Toaster]]
- [[_COMMUNITY_Drawer & Sheet|Drawer & Sheet]]
- [[_COMMUNITY_Placeholder Images|Placeholder Images]]
- [[_COMMUNITY_Logo Images|Logo Images]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 276 edges
2. `Button()` - 28 edges
3. `Card()` - 20 edges
4. `CardContent()` - 18 edges
5. `useAdminStore` - 17 edges
6. `useCartStore` - 17 edges
7. `useAuthStore` - 15 edges
8. `Admin Store` - 14 edges
9. `Input()` - 13 edges
10. `CardHeader()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `SidebarProvider()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts
- `SidebarInset()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts
- `SidebarInput()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts
- `SidebarHeader()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts
- `SidebarFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts

## Hyperedges (group relationships)
- **Authentication Flow System** — signup_form_component, login_form_component, auth_provider_component, auth_check_component, auth_store_concept [INFERRED 0.85]
- **Cart and Checkout System** — header_component, store_view_component, product_card_component, delivery_map_component, cart_store_concept [INFERRED 0.85]
- **Radix-based UI Component Library** — ui_switch, ui_dialog, ui_select, ui_command, ui_navigation_menu [INFERRED 0.70]
- **Form Input Composition** — ui_input, ui_textarea, ui_input_group [EXTRACTED 0.95]
- **Radix Menu and Collapse Primitives** — ui_context_menu, ui_dropdown_menu, ui_collapsible [INFERRED 0.85]
- **Overlay Alert and Feedback Components** — ui_alert, ui_alert_dialog, ui_sonner [INFERRED 0.75]
- **Overlay Components** — sheet, drawer, hover_card [INFERRED 0.85]
- **Form Input System** — field, form, label, input_otp, radio_group, checkbox [INFERRED 0.80]
- **Button Variant System** — button, toggle, toggle_group [INFERRED 0.85]
- **Admin CRUD Ecosystem** — lib_admin_store_AdminStore, app_admin_page_AdminDashboard, app_admin_productos_page_ProductsAdmin, app_admin_productos_id_page_ProductDetailAdmin, app_admin_categorias_page_CategoriesAdmin, app_admin_usuarios_page_UsersPage, app_admin_ordenes_page_OrdersPage, app_admin_monedas_page_CurrenciesPage [EXTRACTED 1.00]
- **Product Data Model** — lib_store_Product, lib_store_Unit, lib_admin_store_Category, lib_store_CartItem, lib_admin_store_OrderItem, lib_admin_store_Order [EXTRACTED 1.00]
- **Persisted Zustand Stores** — lib_store_CartStore, lib_admin_store_AdminStore, lib_auth_context_AuthStore [EXTRACTED 1.00]
- **Authentication System** — auth_signup_page, auth_login_page, auth_actions, perfil_page, auth_demo_page, auth_layout [EXTRACTED 1.00]
- **Purchase and Checkout Flow** — cart_page, checkout_page, order_confirmation_page, product_id_page, admin_envios_page [EXTRACTED 1.00]
- **App Image Asset Library** — icon_svg, placeholder_svg, placeholder_logo_svg, placeholder_jpg, placeholder_user_jpg, icon_dark_png, icon_light_png, placeholder_logo_png, apple_icon_png [INFERRED 0.95]

## Communities (81 total, 44 thin omitted)

### Community 0 - "Admin Pages"
Cohesion: 0.08
Nodes (67): AdminDashboard(), CategoriesAdmin(), emptyCategory, DeliveryAdmin(), emptyZone, ProductDetailAdmin(), AdminStore, Category (+59 more)

### Community 1 - "App Pages"
Cohesion: 0.07
Nodes (43): HomePage(), CartPage(), CheckoutPage(), DeliveryMap, customIcon, DeliveryMap(), DeliveryMapProps, MapEventsProps (+35 more)

### Community 2 - "UI Navigation & Display"
Cohesion: 0.06
Nodes (43): cn(), AlertDialogOverlay(), Avatar(), AvatarFallback(), AvatarImage(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink() (+35 more)

### Community 3 - "UI Layout & Shell"
Cohesion: 0.06
Nodes (42): useIsMobile(), Sheet(), SheetClose(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+34 more)

### Community 4 - "Auth Actions"
Cohesion: 0.08
Nodes (31): AuthResponse, loginAction(), signupAction(), validateGender(), validateName(), validatePassword(), validatePhone(), metadata (+23 more)

### Community 5 - "Toast System"
Cohesion: 0.07
Nodes (36): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+28 more)

### Community 6 - "Admin Navigation"
Cohesion: 0.09
Nodes (15): AdminLayout(), navigation, InputOTP, ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, HoverCardContent() (+7 more)

### Community 7 - "Admin Business Pages"
Cohesion: 0.13
Nodes (22): Categories Admin Page, Admin Layout, Currencies Admin Page, Orders Admin Page, Admin Dashboard, Product Detail Admin Page, Products Admin Page, Users Admin Page (+14 more)

### Community 8 - "Menubar"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 9 - "Context Menu"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 10 - "Dropdown Menu"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 11 - "Carousel"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 12 - "Item Component"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 13 - "Calendar & Pagination"
Cohesion: 0.18
Nodes (10): buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps (+2 more)

### Community 14 - "Form Component"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 15 - "Drawer"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 16 - "Chart Component"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 17 - "Core App Architecture"
Cohesion: 0.29
Nodes (10): Auth Check Component, Auth Provider Component, Auth Store, Cart Store, Delivery Map Component, Header Component, Login Form Component, Product Card Component (+2 more)

### Community 18 - "Input Group"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 19 - "Empty State"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 20 - "Toggle Group"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 21 - "Base UI Primitives"
Cohesion: 0.33
Nodes (6): Alert, Alert Dialog, Breadcrumb, Button, Calendar, Pagination

### Community 22 - "Auth Pages"
Cohesion: 0.47
Nodes (6): Auth Server Actions, Auth Demo Page, Auth Layout, Login Page, Signup Page, User Profile Page

### Community 23 - "Accordion"
Cohesion: 0.4
Nodes (3): AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 25 - "Alert"
Cohesion: 0.5
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 26 - "Store Pages"
Cohesion: 0.4
Nodes (5): Delivery Admin Page, Shopping Cart Page, Checkout Page, Order Confirmation Page, Product Detail Page

### Community 29 - "Button Variants"
Cohesion: 0.5
Nodes (4): Button, Carousel, Toggle, ToggleGroup

### Community 30 - "App Icons"
Cohesion: 0.5
Nodes (4): Apple Touch Icon, Dark Mode Favicon, Light Mode Favicon, App Icon SVG

### Community 32 - "Input & Textarea"
Cohesion: 0.67
Nodes (3): Input, Input Group, Textarea

### Community 33 - "Field & Form"
Cohesion: 1.0
Nodes (3): Field, Form, Label

### Community 34 - "Root Layout & Auth"
Cohesion: 0.67
Nodes (3): Root Layout, Auth User (Server), Auth Store (Client)

## Knowledge Gaps
- **147 isolated node(s):** `nextConfig`, `config`, `OnboardingProps`, `steps`, `SortOption` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Navigation & Display` to `Admin Pages`, `App Pages`, `UI Layout & Shell`, `Toast System`, `Admin Navigation`, `Menubar`, `Context Menu`, `Dropdown Menu`, `Carousel`, `Item Component`, `Calendar & Pagination`, `Form Component`, `Drawer`, `Chart Component`, `Input Group`, `Empty State`, `Toggle Group`, `Accordion`, `Popover`, `Alert`, `Resizable`?**
  _High betweenness centrality (0.458) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Auth Actions` to `App Pages`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `Button()` connect `App Pages` to `Admin Pages`, `UI Navigation & Display`, `UI Layout & Shell`, `Admin Navigation`, `Carousel`, `Calendar & Pagination`, `Input Group`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `nextConfig`, `config`, `OnboardingProps` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `App Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `UI Navigation & Display` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._