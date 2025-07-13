import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={tw`flex-1 bg-gray-50 justify-center items-center p-6`}>
          <View style={tw`bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full max-w-sm`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4`}>
                <MaterialIcons name="error-outline" size={32} color="#DC2626" />
              </View>
              <Text style={tw`text-xl font-bold text-gray-800 text-center mb-2`}>
                Erro no Dashboard
              </Text>
              <Text style={tw`text-gray-600 text-center mb-4`}>
                Ocorreu um erro inesperado ao carregar o dashboard. Tente novamente.
              </Text>
            </View>

            {__DEV__ && this.state.error && (
              <View style={tw`bg-gray-50 rounded-lg p-3 mb-4`}>
                <Text style={tw`text-xs text-gray-600 font-mono`}>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.handleRetry}
              style={tw`bg-blue-500 py-3 rounded-lg flex-row items-center justify-center`}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={tw`text-white font-medium ml-2`}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}