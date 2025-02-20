import React, { useCallback, useEffect, useState } from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { fieldAffectsData, tabHasName } from '../../../../../fields/config/types';
import FieldDescription from '../../FieldDescription';
import toKebabCase from '../../../../../utilities/toKebabCase';
import { useCollapsible } from '../../../elements/Collapsible/provider';
import { TabsProvider } from './provider';
import { usePreferences } from '../../../utilities/Preferences';
import { DocumentPreferences } from '../../../../../preferences/types';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'tabs-field';

const TabsField: React.FC<Props> = (props) => {
  const {
    tabs,
    fieldTypes,
    path,
    permissions,
    indexPath,
    admin: {
      readOnly,
      className,
    },
  } = props;

  const { getPreference, setPreference } = usePreferences();
  const { preferencesKey } = useDocumentInfo();

  const isWithinCollapsible = useCollapsible();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const tabsPrefKey = `tabs-${indexPath}`;

  useEffect(() => {
    const getInitialPref = async () => {
      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey);
      const initialIndex = path ? existingPreferences?.fields?.[path]?.tabIndex : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex;
      setActiveTabIndex(initialIndex || 0)
    }
    getInitialPref();
  }, [path, indexPath])

  const handleTabChange = useCallback(async (incomingTabIndex: number) => {
    setActiveTabIndex(incomingTabIndex)

    const existingPreferences: DocumentPreferences = await getPreference(preferencesKey);

    setPreference(preferencesKey, {
      ...existingPreferences,
      ...path ? {
        fields: {
          ...existingPreferences?.fields || {},
          [path]: {
            ...existingPreferences?.fields?.[path],
            tabIndex: incomingTabIndex,
          },
        },
      } : {
        fields: {
          ...existingPreferences?.fields,
          [tabsPrefKey]: {
            ...existingPreferences?.fields?.[tabsPrefKey],
            tabIndex: incomingTabIndex,
          }
        },
      }
    });
  }, [indexPath, preferencesKey, getPreference, setPreference, path])

  const activeTabConfig = tabs[activeTabIndex];

  return (
    <div className={[
      className,
      baseClass,
      isWithinCollapsible && `${baseClass}--within-collapsible`,
    ].filter(Boolean).join(' ')}
    >
      <TabsProvider>
        <div className={`${baseClass}__tabs-wrap`}>
          <div className={`${baseClass}__tabs`}>
            {tabs.map((tab, tabIndex) => {
              return (
                <button
                  key={tabIndex}
                  type="button"
                  className={[
                    `${baseClass}__tab-button`,
                    activeTabIndex === tabIndex && `${baseClass}__tab-button--active`,
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    handleTabChange(tabIndex)
                  }}
                >
                  {tab.label ? tab.label : (tabHasName(tab) && tab.name)}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`${baseClass}__content-wrap`}>
          {activeTabConfig && (
            <div className={[
              `${baseClass}__tab`,
              `${baseClass}__tab-${toKebabCase(activeTabConfig.label)}`,
            ].join(' ')}
            >
              <FieldDescription
                className={`${baseClass}__description`}
                description={activeTabConfig.description}
              />
              <RenderFields
                key={String(activeTabConfig.label)}
                forceRender
                readOnly={readOnly}
                permissions={tabHasName(activeTabConfig) ? permissions[activeTabConfig.name].fields : permissions}
                fieldTypes={fieldTypes}
                fieldSchema={activeTabConfig.fields.map((field) => ({
                  ...field,
                  path: `${path ? `${path}.` : ''}${tabHasName(activeTabConfig) ? `${activeTabConfig.name}.` : ''}${fieldAffectsData(field) ? field.name : ''}`,
                }))}
                indexPath={indexPath}
              />
            </div>
          )}
        </div>
      </TabsProvider>
    </div>
  );
};

export default withCondition(TabsField);
