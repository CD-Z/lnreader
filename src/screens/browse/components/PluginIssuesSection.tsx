import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import * as Linking from 'expo-linking';

import { Button } from '@components';
import { usePluginActions, useTheme } from '@hooks/persisted';
import { usePluginIssues } from '@hooks/persisted/usePluginIssues';
import { getPluginIssueUrl } from '@plugins/issueMetadata';
import { getString } from '@i18n/translations';
import { showToast } from '@utils/showToast';

import { usePluginIssueTitles } from '../hooks/usePluginIssueTitles';
import { pluginIssuePresentation } from '../utils/pluginIssuePresentation';

interface PluginIssuesSectionProps {
  pluginId: string;
}

export const PluginIssuesSection = ({ pluginId }: PluginIssuesSectionProps) => {
  const theme = useTheme();
  const { groups, isRefreshing, refreshFailed } = usePluginIssues(pluginId);
  const { refreshPlugins } = usePluginActions();
  const titles = usePluginIssueTitles(groups);
  const [isPending, setIsPending] = useState(false);

  const refresh = async () => {
    setIsPending(true);
    try {
      await refreshPlugins();
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPending(false);
    }
  };

  const openIssue = async (issueNumber: number) => {
    try {
      await Linking.openURL(getPluginIssueUrl(issueNumber));
    } catch {
      showToast(
        getString('browseScreen.issueIndex.openFailed', { issueNumber }),
      );
    }
  };

  return (
    <View style={[styles.section, { borderTopColor: theme.outlineVariant }]}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.onSurface }]}
      >
        {getString('browseScreen.issueIndex.title')}
      </Text>
      <Button
        compact
        disabled={isPending || isRefreshing}
        icon="refresh"
        mode="text"
        onPress={refresh}
        style={styles.refreshButton}
        title={getString('browseScreen.issueIndex.refresh')}
      />

      {groups === undefined ? (
        isRefreshing ? (
          <ActivityIndicator
            accessibilityLabel={getString('common.loading')}
            accessibilityRole="progressbar"
            color={theme.primary}
            style={styles.progress}
          />
        ) : (
          <Text style={[styles.message, { color: theme.onSurfaceVariant }]}>
            {getString('browseScreen.issueIndex.unavailable')}
          </Text>
        )
      ) : (
        <>
          {isRefreshing ? (
            <ActivityIndicator
              accessibilityLabel={getString('common.loading')}
              accessibilityRole="progressbar"
              color={theme.primary}
              size="small"
              style={styles.progress}
            />
          ) : null}
          {refreshFailed ? (
            <Text style={[styles.message, { color: theme.onSurfaceVariant }]}>
              {getString('browseScreen.issueIndex.cached')}
            </Text>
          ) : null}
          {groups.length === 0 ? (
            <Text style={[styles.message, { color: theme.onSurfaceVariant }]}>
              {getString('browseScreen.issueIndex.empty')}
            </Text>
          ) : (
            groups.map(group => {
              const category = group[0];
              const presentation = pluginIssuePresentation[category];

              return (
                <View key={category} style={styles.group}>
                  <View style={styles.groupHeading}>
                    <MaterialCommunityIcons
                      accessible={false}
                      color={theme[presentation.colorKey] as string}
                      name={presentation.iconName}
                      size={24}
                    />
                    <Text
                      accessibilityRole="header"
                      style={[styles.groupTitle, { color: theme.onSurface }]}
                    >
                      {getString(
                        `browseScreen.issueIndex.categories.${presentation.labelKey}`,
                      )}
                    </Text>
                  </View>
                  <View>
                    {group.map((issueNumber, index) => {
                      if (index === 0) {
                        return null;
                      }

                      const title = titles[issueNumber];
                      const accessibilityLabel = title
                        ? getString(
                            'browseScreen.issueIndex.openIssueWithTitle',
                            { issueNumber, title },
                          )
                        : getString('browseScreen.issueIndex.openIssue', {
                            issueNumber,
                          });

                      return (
                        <Pressable
                          accessibilityLabel={accessibilityLabel}
                          accessibilityRole="link"
                          key={issueNumber}
                          onPress={() => {
                            void openIssue(issueNumber);
                          }}
                          android_ripple={{ color: theme.rippleColor }}
                          style={[
                            styles.issueLink,
                            { borderBottomColor: theme.outlineVariant },
                          ]}
                        >
                          <View style={styles.issueText}>
                            {title ? (
                              <>
                                <Text
                                  numberOfLines={2}
                                  style={[
                                    styles.issueTitle,
                                    { color: theme.onSurface },
                                  ]}
                                >
                                  {title}
                                </Text>
                                <Text
                                  style={[
                                    styles.supportingIssueNumber,
                                    { color: theme.onSurfaceVariant },
                                  ]}
                                >
                                  #{issueNumber}
                                </Text>
                              </>
                            ) : (
                              <Text
                                style={[
                                  styles.issueTitle,
                                  { color: theme.onSurface },
                                ]}
                              >
                                #{issueNumber}
                              </Text>
                            )}
                          </View>
                          <MaterialCommunityIcons
                            accessible={false}
                            color={theme.onSurfaceVariant}
                            name="open-in-new"
                            size={24}
                            style={styles.openIcon}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    marginTop: 20,
  },
  groupHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  issueLink: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  issueText: {
    flex: 1,
    minWidth: 0,
  },
  issueTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  message: {
    marginTop: 8,
  },
  openIcon: {
    marginStart: 8,
  },
  progress: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  refreshButton: {
    alignSelf: 'flex-start',
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
    paddingTop: 16,
  },
  supportingIssueNumber: {
    fontSize: 12,
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
