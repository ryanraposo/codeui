<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="https://i.imgur.com/WKgSi72.png" alt="Project logo"></a>
</p>

<h2 align="center">CodeUI</h2>

# Usage
## Table of Contents


- [Usage](#usage)
  - [Table of Contents](#table-of-contents)
  - [## Element Information](#-element-information)
      - [<sup>1</sup> Visualizations & Effective Color](#sup1sup-visualizations--effective-color)
      - [<sup>2</sup> Tooltip Descriptions](#sup2sup-tooltip-descriptions)
      - [<sup>3</sup> Info View](#sup3sup-info-view)
  - [## Viewtypes](#-viewtypes)
      - [Standard](#standard)
      - [Palette](#palette)


## Element Information
---

![fds](/usage/info-numbered-v2.png)

#### <sup>1</sup> Visualizations & Effective Color

   The icons for each item represent color setting, as well as indicate the source of those settings. If an icon is partially covered, the prominent color represents a customization (global or workspace) and the color underneath, if any, the next runner up in this ascending priority scheme:
      
      Default -> Theme -> Customization (global) -> Customization (workspace)

   Items which are inherting color will also display the corresponding hex color-code. This value is indicative of the elements **effective** color, just like the prominent icon color.  

#### <sup>2</sup> Tooltip Descriptions

   Hover over UI elements to view a description of each. 

   *Please submit an issue [here](https://github.com/ryanraposo/codeui) for any descriptions found to be missing, incomplete, or innaccurate. Thank you!*

#### <sup>3</sup> Info View

   The *Info view* displays the current theme as defined in your settings, and information about your selection in the *Elements view*. Select an element there to view the colors it is currently inherting. 

## Viewtypes
---
![Viewtypes](../resources/screenshots/viewtypes.png)

#### Standard
Allows browsing by element groups. These groups correspond to different parts of the editor, and form the beginning of the values one might add to User Settings. 

For example, following value would be found under heading *Activity Bar*, as item *Foreground*:

```"activityBar.foreground"```

#### Palette
 In this view, elements retain a long form of the name as items are grouped by color. The configuration above would be listed as *Activity Bar Foregound*, grouped with all elements who share it's effective color. 
 
 This viewtype enables you to make batch changes to elements and alter the palette of the editor, as it appears. 
 
 Toggle views with the command button at the top right of the *Elements* view.

 