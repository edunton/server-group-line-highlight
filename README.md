# server-group-line-highlight README

**Azure Data Studio Extension:** This allows you to set the color of the highlight line and to change it depending upon the server group in focus. It is meant to help you visually disinguish between SQL Server environments quickly so you would make updates to the wron enviroments. The extension requires you to be working out of a work space.

### Command Pallet

- **SGLH: Set Color** => Sets the color of the currently focused-on server group
- **SGLH: Set Color** => Removes the color of the currently focused-on server group
- **SGLH: Show Color** => Shows the hexadeciamal value of the color of the currently focused-on server group

### Build

Require Node.js and NPM.

If you want to build your extension, run:

```
npm run compile
```

Install on your version of Azure Data Studio with the resulting .vsix file in the root of the repository